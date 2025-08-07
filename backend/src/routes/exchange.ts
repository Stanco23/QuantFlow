import express, { Request, Response } from 'express';
import { BybitClient, BybitOrder } from '../services/bybitClient';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Bybit client
const bybitClient = new BybitClient(
  process.env.BYBIT_API_KEY || '',
  process.env.BYBIT_API_SECRET || '',
  process.env.BYBIT_TESTNET === 'true'
);

// POST /api/exchange/orders - Place order
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const { symbol, side, orderType, qty, price, timeInForce } = req.body;

    // Validate required fields
    if (!symbol || !side || !orderType || !qty) {
      return res.status(400).json({
        error: 'Missing required fields: symbol, side, orderType, qty',
      });
    }

    // Validate side
    if (!['Buy', 'Sell'].includes(side)) {
      return res.status(400).json({
        error: 'Invalid side. Must be "Buy" or "Sell"',
      });
    }

    // Validate orderType
    if (!['Market', 'Limit'].includes(orderType)) {
      return res.status(400).json({
        error: 'Invalid orderType. Must be "Market" or "Limit"',
      });
    }

    // For limit orders, price is required
    if (orderType === 'Limit' && !price) {
      return res.status(400).json({
        error: 'Price is required for limit orders',
      });
    }

    const order: BybitOrder = {
      symbol,
      side,
      orderType,
      qty: qty.toString(),
      price: price?.toString(),
      timeInForce,
    };

    const result = await bybitClient.placeOrder(order);

    res.json({
      success: true,
      data: result.result,
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      error: 'Failed to place order',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/exchange/orders/:id - Cancel order
router.delete('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { symbol } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        error: 'Symbol query parameter is required',
      });
    }

    const result = await bybitClient.cancelOrder(symbol, id);

    res.json({
      success: true,
      data: result.result,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      error: 'Failed to cancel order',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/exchange/balance - Account balance
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const balances = await bybitClient.getBalance();

    res.json({
      success: true,
      data: balances,
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({
      error: 'Failed to fetch balance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/exchange/ticker/:symbol - Real-time quote
router.get('/ticker/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({
        error: 'Symbol parameter is required',
      });
    }

    const ticker = await bybitClient.getTicker(symbol.toUpperCase());

    res.json({
      success: true,
      data: ticker,
    });
  } catch (error) {
    console.error('Error fetching ticker:', error);
    res.status(500).json({
      error: 'Failed to fetch ticker data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/exchange/symbols - Get available trading symbols
router.get('/symbols', async (req: Request, res: Response) => {
  try {
    // Get all market data (no symbol parameter)
    const marketData = await bybitClient.getMarketData();

    // Map symbol strings (e.g., "BTCUSDT" → "BTC/USDT")
    const symbols = marketData.map(ticker => {
      const symbol = ticker.symbol;
      // Handle common trading pairs format conversion
      if (symbol.endsWith('USDT')) {
        const base = symbol.slice(0, -4);
        return `${base}/USDT`;
      } else if (symbol.endsWith('USDC')) {
        const base = symbol.slice(0, -4);
        return `${base}/USDC`;
      } else if (symbol.endsWith('BTC')) {
        const base = symbol.slice(0, -3);
        return `${base}/BTC`;
      } else if (symbol.endsWith('ETH')) {
        const base = symbol.slice(0, -3);
        return `${base}/ETH`;
      } else {
        // For other pairs, try to split by common quote currencies
        return symbol;
      }
    });

    res.json({
      success: true,
      data: symbols,
    });
  } catch (error) {
    console.error('Error fetching trading symbols:', error);
    res.status(500).json({
      error: 'Failed to fetch trading symbols',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/exchange/historical - Download candles for backtesting
router.get('/historical', async (req: Request, res: Response) => {
  try {
    const { symbol, interval, start, end, limit } = req.query;

    if (!symbol || !interval) {
      return res.status(400).json({
        error: 'Symbol and interval parameters are required',
      });
    }

    // Validate interval
    const validIntervals = ['1', '3', '5', '15', '30', '60', '120', '240', '360', '720', 'D', 'W', 'M'];
    if (!validIntervals.includes(interval as string)) {
      return res.status(400).json({
        error: `Invalid interval. Valid intervals: ${validIntervals.join(', ')}`,
      });
    }

    const candles = await bybitClient.getHistoricalCandles(
      (symbol as string).toUpperCase(),
      interval as string,
      start ? parseInt(start as string) : undefined,
      end ? parseInt(end as string) : undefined,
      limit ? parseInt(limit as string) : 200
    );

    res.json({
      success: true,
      data: candles,
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({
      error: 'Failed to fetch historical data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
