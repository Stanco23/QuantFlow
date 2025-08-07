import express, { Request, Response } from 'express';
import { LiveTradingEngine, LiveTradingConfig } from '../services/liveEngine';
import { BybitClient } from '../services/bybitClient';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Bybit client and live trading engine
const bybitClient = new BybitClient(
  process.env.BYBIT_API_KEY || '',
  process.env.BYBIT_API_SECRET || '',
  process.env.BYBIT_TESTNET === 'true'
);

const liveEngine = new LiveTradingEngine(bybitClient);

/**
 * POST /api/live/start - Start live trading for a strategy
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const {
      strategyId,
      strategyCode,
      symbols,
      timeframe,
      riskPerTrade,
      tradeSize
    } = req.body;

    // Validate required fields
    if (!strategyId || !strategyCode || !symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        error: 'Missing required fields: strategyId, strategyCode, symbols (array)'
      });
    }

    if (!timeframe || !riskPerTrade || !tradeSize) {
      return res.status(400).json({
        error: 'Missing required fields: timeframe, riskPerTrade, tradeSize'
      });
    }

    // Validate numeric values
    if (typeof strategyId !== 'number' || typeof riskPerTrade !== 'number' || typeof tradeSize !== 'number') {
      return res.status(400).json({
        error: 'strategyId, riskPerTrade, and tradeSize must be numbers'
      });
    }

    if (riskPerTrade <= 0 || riskPerTrade > 100) {
      return res.status(400).json({
        error: 'riskPerTrade must be between 0 and 100'
      });
    }

    if (tradeSize <= 0) {
      return res.status(400).json({
        error: 'tradeSize must be greater than 0'
      });
    }

    // Create live trading configuration
    const config: LiveTradingConfig = {
      strategyId,
      strategyCode,
      symbols,
      timeframe,
      riskPerTrade,
      tradeSize
    };

    // Start live trading
    await liveEngine.start(config);

    res.json({
      success: true,
      message: `Live trading started for strategy ${strategyId}`,
      data: {
        strategyId,
        symbols,
        timeframe,
        status: 'running'
      }
    });

  } catch (error) {
    console.error('Error starting live trading:', error);
    res.status(500).json({
      error: 'Failed to start live trading',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/live/stop - Stop live trading for a strategy
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    const { strategyId } = req.body;

    if (!strategyId || typeof strategyId !== 'number') {
      return res.status(400).json({
        error: 'Missing or invalid strategyId'
      });
    }

    // Stop live trading
    await liveEngine.stop(strategyId);

    res.json({
      success: true,
      message: `Live trading stopped for strategy ${strategyId}`,
      data: {
        strategyId,
        status: 'stopped'
      }
    });

  } catch (error) {
    console.error('Error stopping live trading:', error);
    res.status(500).json({
      error: 'Failed to stop live trading',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/live/status - Get status of all live trading sessions
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Get active strategies from the live engine
    const activeStrategies = Array.from(liveEngine.getActiveStrategies().entries()).map(([strategyId, config]) => ({
      strategyId,
      symbols: config.symbols,
      timeframe: config.timeframe,
      riskPerTrade: config.riskPerTrade,
      tradeSize: config.tradeSize,
      status: 'running'
    }));

    res.json({
      success: true,
      data: {
        totalActiveStrategies: activeStrategies.length,
        strategies: activeStrategies
      }
    });

  } catch (error) {
    console.error('Error getting live trading status:', error);
    res.status(500).json({
      error: 'Failed to get live trading status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/live/status/:strategyId - Get status of a specific live trading session
 */
router.get('/status/:strategyId', async (req: Request, res: Response) => {
  try {
    const strategyId = parseInt(req.params.strategyId, 10);

    if (isNaN(strategyId)) {
      return res.status(400).json({
        error: 'Invalid strategyId'
      });
    }

    const config = liveEngine.getActiveStrategies().get(strategyId);

    if (!config) {
      return res.status(404).json({
        error: 'Strategy not found or not running'
      });
    }

    res.json({
      success: true,
      data: {
        strategyId,
        symbols: config.symbols,
        timeframe: config.timeframe,
        riskPerTrade: config.riskPerTrade,
        tradeSize: config.tradeSize,
        status: 'running'
      }
    });

  } catch (error) {
    console.error('Error getting strategy status:', error);
    res.status(500).json({
      error: 'Failed to get strategy status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/live/restart/:strategyId - Restart a live trading session
 */
router.post('/restart/:strategyId', async (req: Request, res: Response) => {
  try {
    const strategyId = parseInt(req.params.strategyId, 10);

    if (isNaN(strategyId)) {
      return res.status(400).json({
        error: 'Invalid strategyId'
      });
    }

    const config = liveEngine.getActiveStrategies().get(strategyId);

    if (!config) {
      return res.status(404).json({
        error: 'Strategy not found or not running'
      });
    }

    // Stop and restart the strategy
    await liveEngine.stop(strategyId);
    await liveEngine.start(config);

    res.json({
      success: true,
      message: `Live trading restarted for strategy ${strategyId}`,
      data: {
        strategyId,
        status: 'restarted'
      }
    });

  } catch (error) {
    console.error('Error restarting live trading:', error);
    res.status(500).json({
      error: 'Failed to restart live trading',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/live/stop-all - Stop all live trading sessions
 */
router.delete('/stop-all', async (req: Request, res: Response) => {
  try {
    const activeStrategies = Array.from(liveEngine.getActiveStrategies().keys());
    
    // Stop all active strategies
    for (const strategyId of activeStrategies) {
      await liveEngine.stop(strategyId);
    }

    res.json({
      success: true,
      message: `Stopped ${activeStrategies.length} live trading sessions`,
      data: {
        stoppedStrategies: activeStrategies,
        totalStopped: activeStrategies.length
      }
    });

  } catch (error) {
    console.error('Error stopping all live trading:', error);
    res.status(500).json({
      error: 'Failed to stop all live trading sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
