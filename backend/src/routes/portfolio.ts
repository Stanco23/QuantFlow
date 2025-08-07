import express, { Request, Response } from 'express';
import { BybitClient } from '../services/bybitClient';
import db from '../database/connection';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Bybit client
const bybitClient = new BybitClient(
  process.env.BYBIT_API_KEY || '',
  process.env.BYBIT_API_SECRET || '',
  process.env.BYBIT_TESTNET === 'true'
);

interface PortfolioSummary {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  positions: any[];
  balance: any[];
  riskMetrics: RiskMetrics;
}

interface RiskMetrics {
  totalExposure: number;
  leverageRatio: number;
  valueAtRisk: number; // VaR at 95% confidence
  maxDrawdown: number;
  sharpeRatio: number;
}

/**
 * GET /api/portfolio/positions - Get all open positions
 */
router.get('/positions', async (req: Request, res: Response) => {
  try {
    // Get live positions from Bybit
    const livePositions = await bybitClient.getPositions();
    
    // Get historical trades for additional context
    const recentTrades = await db('trades')
      .select('*')
      .where('executed_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .orderBy('executed_at', 'desc')
      .limit(50);

    // Calculate position metrics
    const enrichedPositions = await Promise.all(
      livePositions.map(async (position) => {
        // Get current market price
        const ticker = await bybitClient.getTicker(position.symbol);
        const currentPrice = parseFloat(ticker.lastPrice);
        const positionSize = parseFloat(position.size);
        const entryPrice = parseFloat(position.entryPrice);

        // Calculate unrealized P&L
        const unrealizedPnL = position.side === 'Buy' 
          ? (currentPrice - entryPrice) * positionSize
          : (entryPrice - currentPrice) * positionSize;

        // Get related trades
        const relatedTrades = recentTrades.filter(t => t.symbol === position.symbol);

        return {
          ...position,
          currentPrice,
          unrealizedPnL,
          unrealizedPnLPercent: entryPrice > 0 ? (unrealizedPnL / (entryPrice * positionSize)) * 100 : 0,
          positionValue: currentPrice * positionSize,
          recentTrades: relatedTrades.length,
          lastTradeTime: relatedTrades.length > 0 ? relatedTrades[0].executed_at : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        positions: enrichedPositions,
        totalPositions: enrichedPositions.length,
        openPositions: enrichedPositions.filter(p => parseFloat(p.size) > 0).length
      }
    });

  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({
      error: 'Failed to fetch positions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/portfolio/balance - Get account balance information
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    // Get account balance
    const balances = await bybitClient.getBalance();
    
    // Calculate total portfolio value
    let totalValue = 0;
    const enrichedBalances = await Promise.all(
      balances.map(async (balance) => {
        const free = parseFloat(balance.free);
        const used = parseFloat(balance.used);
        const total = parseFloat(balance.total);

        // For non-USD assets, get current price to calculate USD value
        let usdValue = total;
        if (balance.coin !== 'USD' && balance.coin !== 'USDT') {
          try {
            const ticker = await bybitClient.getTicker(`${balance.coin}USDT`);
            usdValue = total * parseFloat(ticker.lastPrice);
          } catch (error) {
            // If can't get price, assume 1:1 for stablecoins or 0 for others
            usdValue = ['USDC', 'BUSD', 'DAI'].includes(balance.coin) ? total : 0;
          }
        }

        totalValue += usdValue;

        return {
          ...balance,
          usdValue,
          percentage: 0 // Will be calculated after totalValue is known
        };
      })
    );

    // Calculate percentages
    enrichedBalances.forEach(balance => {
      balance.percentage = totalValue > 0 ? (balance.usdValue / totalValue) * 100 : 0;
    });

    res.json({
      success: true,
      data: {
        balances: enrichedBalances,
        totalValue,
        totalAssets: enrichedBalances.length,
        activeAssets: enrichedBalances.filter(b => parseFloat(b.total) > 0).length
      }
    });

  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({
      error: 'Failed to fetch balance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/portfolio/risk - Calculate portfolio risk metrics
 */
router.get('/risk', async (req: Request, res: Response) => {
  try {
    // Get positions and balance
    const positions = await bybitClient.getPositions();
    const balances = await bybitClient.getBalance();

    // Calculate total portfolio value
    let totalPortfolioValue = 0;
    for (const balance of balances) {
      const total = parseFloat(balance.total);
      if (balance.coin === 'USD' || balance.coin === 'USDT') {
        totalPortfolioValue += total;
      } else if (total > 0) {
        try {
          const ticker = await bybitClient.getTicker(`${balance.coin}USDT`);
          totalPortfolioValue += total * parseFloat(ticker.lastPrice);
        } catch (error) {
          // Skip if can't get price
        }
      }
    }

    // Calculate total exposure
    let totalExposure = 0;
    const positionValues: number[] = [];
    
    for (const position of positions) {
      const positionSize = parseFloat(position.size);
      if (positionSize > 0) {
        const positionValue = parseFloat(position.positionValue);
        totalExposure += positionValue;
        positionValues.push(positionValue);
      }
    }

    // Calculate leverage ratio
    const leverageRatio = totalPortfolioValue > 0 ? totalExposure / totalPortfolioValue : 0;

    // Get recent trades for historical analysis
    const recentTrades = await db('trades')
      .select('*')
      .where('executed_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      .orderBy('executed_at', 'desc');

    // Calculate Value at Risk (simplified Monte Carlo simulation)
    const valueAtRisk = calculateValueAtRisk(positionValues, totalPortfolioValue);

    // Calculate max drawdown from recent trades
    const maxDrawdown = calculateMaxDrawdown(recentTrades);

    // Calculate Sharpe ratio from recent trades
    const sharpeRatio = calculateSharpeRatio(recentTrades, totalPortfolioValue);

    const riskMetrics: RiskMetrics = {
      totalExposure,
      leverageRatio,
      valueAtRisk,
      maxDrawdown,
      sharpeRatio
    };

    // Risk assessment
    const riskLevel = assessRiskLevel(riskMetrics);

    res.json({
      success: true,
      data: {
        metrics: riskMetrics,
        riskLevel,
        totalPortfolioValue,
        recommendations: generateRiskRecommendations(riskMetrics)
      }
    });

  } catch (error) {
    console.error('Error calculating risk metrics:', error);
    res.status(500).json({
      error: 'Failed to calculate risk metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/portfolio/summary - Get complete portfolio summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    // Get all portfolio data
    const [positions, balances] = await Promise.all([
      bybitClient.getPositions(),
      bybitClient.getBalance()
    ]);

    // Calculate total portfolio value
    let totalValue = 0;
    let totalPnL = 0;

    // Process balances
    const processedBalances = await Promise.all(
      balances.map(async (balance) => {
        const total = parseFloat(balance.total);
        let usdValue = total;

        if (balance.coin !== 'USD' && balance.coin !== 'USDT' && total > 0) {
          try {
            const ticker = await bybitClient.getTicker(`${balance.coin}USDT`);
            usdValue = total * parseFloat(ticker.lastPrice);
          } catch (error) {
            usdValue = ['USDC', 'BUSD', 'DAI'].includes(balance.coin) ? total : 0;
          }
        }

        totalValue += usdValue;
        return { ...balance, usdValue };
      })
    );

    // Process positions
    const processedPositions = positions.map(position => {
      const unrealizedPnL = parseFloat(position.unrealizedPnl);
      totalPnL += unrealizedPnL;
      return position;
    });

    // Get recent performance data
    const recentTrades = await db('trades')
      .select('*')
      .where('executed_at', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
      .orderBy('executed_at', 'desc');

    const weeklyPnL = recentTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

    const summary: PortfolioSummary = {
      totalValue,
      totalPnL,
      totalPnLPercent: totalValue > 0 ? (totalPnL / totalValue) * 100 : 0,
      positions: processedPositions,
      balance: processedBalances,
      riskMetrics: {
        totalExposure: processedPositions.reduce((sum, p) => sum + parseFloat(p.positionValue || '0'), 0),
        leverageRatio: 0, // Calculated in risk endpoint
        valueAtRisk: 0,
        maxDrawdown: 0,
        sharpeRatio: 0
      }
    };

    res.json({
      success: true,
      data: {
        summary,
        performance: {
          weeklyPnL,
          weeklyPnLPercent: totalValue > 0 ? (weeklyPnL / totalValue) * 100 : 0,
          totalTrades: recentTrades.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    res.status(500).json({
      error: 'Failed to fetch portfolio summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions

function calculateValueAtRisk(positionValues: number[], portfolioValue: number, confidenceLevel: number = 0.95): number {
  if (positionValues.length === 0) return 0;
  
  // Simplified VaR calculation using historical simulation
  const returns = positionValues.map(value => value / portfolioValue);
  returns.sort((a, b) => a - b);
  
  const varIndex = Math.floor((1 - confidenceLevel) * returns.length);
  return Math.abs(returns[varIndex] || 0) * portfolioValue;
}

function calculateMaxDrawdown(trades: any[]): number {
  if (trades.length === 0) return 0;

  let peak = 0;
  let maxDrawdown = 0;
  let runningPnL = 0;

  // Sort trades by execution time
  const sortedTrades = trades.sort((a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime());

  sortedTrades.forEach(trade => {
    runningPnL += trade.pnl || 0;
    peak = Math.max(peak, runningPnL);
    const drawdown = peak - runningPnL;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });

  return maxDrawdown;
}

function calculateSharpeRatio(trades: any[], portfolioValue: number): number {
  if (trades.length === 0) return 0;

  const returns = trades.map(trade => (trade.pnl || 0) / portfolioValue);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  return stdDev > 0 ? avgReturn / stdDev : 0;
}

function assessRiskLevel(metrics: RiskMetrics): string {
  if (metrics.leverageRatio > 3 || metrics.valueAtRisk > 0.1) return 'High';
  if (metrics.leverageRatio > 1.5 || metrics.valueAtRisk > 0.05) return 'Medium';
  return 'Low';
}

function generateRiskRecommendations(metrics: RiskMetrics): string[] {
  const recommendations: string[] = [];
  
  if (metrics.leverageRatio > 2) {
    recommendations.push('Consider reducing leverage to manage risk exposure');
  }
  
  if (metrics.valueAtRisk > 0.1) {
    recommendations.push('High Value at Risk detected - consider position sizing adjustments');
  }
  
  if (metrics.maxDrawdown > 0.2) {
    recommendations.push('Significant drawdown observed - review risk management strategy');
  }
  
  if (metrics.sharpeRatio < 0.5) {
    recommendations.push('Low risk-adjusted returns - consider strategy optimization');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Portfolio risk metrics are within acceptable ranges');
  }
  
  return recommendations;
}

export default router;
