import express, { Request, Response } from 'express';
import { BacktestEngine, BacktestConfig } from '../services/backtester';
import { BybitClient } from '../services/bybitClient';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Bybit client and backtest engine
const bybitClient = new BybitClient(
  process.env.BYBIT_API_KEY || '',
  process.env.BYBIT_API_SECRET || '',
  process.env.BYBIT_TESTNET === 'true'
);

const backtestEngine = new BacktestEngine(bybitClient);

/**
 * POST /api/backtest - Run a new backtest
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      strategyCode,
      symbols,
      timeframe,
      startDate,
      endDate,
      initialCapital,
      riskPerTrade,
      commission,
      strategyId
    } = req.body;

    // Validate required fields
    if (!strategyCode || !symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid required fields: strategyCode, symbols (array)'
      });
    }

    if (!timeframe || !startDate || !endDate || !initialCapital) {
      return res.status(400).json({
        error: 'Missing required fields: timeframe, startDate, endDate, initialCapital'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format for startDate or endDate'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        error: 'startDate must be before endDate'
      });
    }

    // Validate numeric values
    if (typeof initialCapital !== 'number' || initialCapital <= 0) {
      return res.status(400).json({
        error: 'initialCapital must be a positive number'
      });
    }

    // Create backtest configuration
    const config: BacktestConfig = {
      strategyCode,
      symbols,
      timeframe,
      startDate: start,
      endDate: end,
      initialCapital,
      riskPerTrade: riskPerTrade || 2, // Default 2%
      commission: commission || 0.001, // Default 0.1%
    };

    // Run the backtest
    const result = await backtestEngine.runBacktest(config, strategyId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error running backtest:', error);
    res.status(500).json({
      error: 'Failed to run backtest',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/backtest - List all backtests
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const backtests = await backtestEngine.listBacktests();

    res.json({
      success: true,
      data: backtests
    });

  } catch (error) {
    console.error('Error fetching backtests:', error);
    res.status(500).json({
      error: 'Failed to fetch backtests',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/backtest/:id - Get specific backtest result
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const backtestId = parseInt(id, 10);

    if (isNaN(backtestId)) {
      return res.status(400).json({
        error: 'Invalid backtest ID'
      });
    }

    const result = await backtestEngine.getBacktestResult(backtestId);

    if (!result) {
      return res.status(404).json({
        error: 'Backtest not found'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching backtest:', error);
    res.status(500).json({
      error: 'Failed to fetch backtest',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/backtest/:id/trades - Get trades for a specific backtest
 */
router.get('/:id/trades', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const backtestId = parseInt(id, 10);

    if (isNaN(backtestId)) {
      return res.status(400).json({
        error: 'Invalid backtest ID'
      });
    }

    const result = await backtestEngine.getBacktestResult(backtestId);

    if (!result) {
      return res.status(404).json({
        error: 'Backtest not found'
      });
    }

    res.json({
      success: true,
      data: {
        trades: result.trades,
        metrics: result.metrics,
        totalTrades: result.trades.length
      }
    });

  } catch (error) {
    console.error('Error fetching backtest trades:', error);
    res.status(500).json({
      error: 'Failed to fetch backtest trades',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/backtest/quick - Run a quick backtest with predefined settings
 */
router.post('/quick', async (req: Request, res: Response) => {
  try {
    const { strategyCode, symbol } = req.body;

    if (!strategyCode || !symbol) {
      return res.status(400).json({
        error: 'Missing required fields: strategyCode, symbol'
      });
    }

    // Create quick backtest config (last 30 days)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago

    const config: BacktestConfig = {
      strategyCode,
      symbols: [symbol],
      timeframe: '1H', // 1 hour candles
      startDate,
      endDate,
      initialCapital: 10000, // $10,000
      riskPerTrade: 2, // 2%
      commission: 0.001, // 0.1%
    };

    const result = await backtestEngine.runBacktest(config);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error running quick backtest:', error);
    res.status(500).json({
      error: 'Failed to run quick backtest',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
