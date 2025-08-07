import { BybitClient, BybitCandle } from './bybitClient';
import { parseDSL, executeStrategy } from '@quantflow/shared';
import knex from '../database/connection';

export interface BacktestConfig {
  strategyCode: string;
  symbols: string[];
  timeframe: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  riskPerTrade: number; // Percentage of capital to risk per trade
  commission: number; // Commission rate (e.g., 0.001 for 0.1%)
}

export interface Trade {
  id?: number;
  symbol: string;
  side: 'Buy' | 'Sell';
  type: 'Market' | 'Limit';
  quantity: number;
  price: number;
  fee: number;
  executedAt: Date;
  pnl?: number;
  metadata?: any;
}

export interface BacktestResult {
  id?: number;
  strategyId?: number;
  name: string;
  config: BacktestConfig;
  status: 'pending' | 'running' | 'completed' | 'failed';
  trades: Trade[];
  metrics: BacktestMetrics;
  equityCurve: { timestamp: number; equity: number }[];
  startDate: Date;
  endDate: Date;
  initialCapital: number;
}

export interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  totalReturnPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  profitFactor: number;
  avgWinningTrade: number;
  avgLosingTrade: number;
  maxWinningStreak: number;
  maxLosingStreak: number;
  totalFees: number;
}

export class BacktestEngine {
  private bybitClient: BybitClient;
  private db: any;

  constructor(bybitClient: BybitClient) {
    this.bybitClient = bybitClient;
    this.db = knex;
  }

  /**
   * Run a backtest with the given configuration
   */
  async runBacktest(config: BacktestConfig, strategyId?: number): Promise<BacktestResult> {
    const backtestId = await this.createBacktestRecord(config, strategyId);
    
    try {
      // Update status to running
      await this.updateBacktestStatus(backtestId, 'running');

      // Parse the strategy DSL
      const { ast, errors } = parseDSL(config.strategyCode);
      if (errors && errors.length > 0) {
        throw new Error(`Strategy parsing errors: ${errors.join(', ')}`);
      }
      
      if (!ast) {
        throw new Error('Failed to parse strategy: AST is null');
      }

      // Fetch historical data for all symbols
      const historicalData = await this.fetchHistoricalData(config);

      // Run the backtest simulation
      const result = await this.simulate(config, ast, historicalData, backtestId);

      // Calculate metrics
      const metrics = this.calculateMetrics(result.trades, config.initialCapital);

      // Create final result
      const backtestResult: BacktestResult = {
        id: backtestId,
        strategyId,
        name: `Backtest ${new Date().toISOString()}`,
        config,
        status: 'completed',
        trades: result.trades,
        metrics,
        equityCurve: result.equityCurve,
        startDate: config.startDate,
        endDate: config.endDate,
        initialCapital: config.initialCapital
      };

      // Update the database with results
      await this.updateBacktestResults(backtestId, backtestResult);

      return backtestResult;
    } catch (error) {
      await this.updateBacktestStatus(backtestId, 'failed');
      throw error;
    }
  }

  /**
   * Fetch historical candle data for backtesting
   */
  private async fetchHistoricalData(config: BacktestConfig): Promise<Map<string, BybitCandle[]>> {
    const data = new Map<string, BybitCandle[]>();

    for (const symbol of config.symbols) {
      try {
        const candles = await this.bybitClient.getHistorical(
          symbol,
          config.timeframe,
          config.startDate.getTime(),
          config.endDate.getTime(),
          1000 // Max limit per request
        );

        // Sort by timestamp to ensure chronological order
        candles.sort((a, b) => a.openTime - b.openTime);
        data.set(symbol, candles);
      } catch (error) {
        console.error(`Failed to fetch data for ${symbol}:`, error);
        throw new Error(`Failed to fetch historical data for ${symbol}`);
      }
    }

    return data;
  }

  /**
   * Simulate trading using the parsed strategy
   */
  private async simulate(
    config: BacktestConfig,
    ast: any,
    historicalData: Map<string, BybitCandle[]>,
    backtestId: number
  ): Promise<{ trades: Trade[]; equityCurve: { timestamp: number; equity: number }[] }> {
    const trades: Trade[] = [];
    const equityCurve: { timestamp: number; equity: number }[] = [];
    let currentCapital = config.initialCapital;
    let positions: Map<string, { quantity: number; avgPrice: number }> = new Map();

    // Get all unique timestamps and sort them
    const allTimestamps = new Set<number>();
    for (const [symbol, candles] of historicalData) {
      candles.forEach(candle => allTimestamps.add(candle.openTime));
    }
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    // Simulate each time step
    for (const timestamp of sortedTimestamps) {
      const currentCandles: Map<string, BybitCandle> = new Map();
      
      // Get current candle for each symbol at this timestamp
      for (const [symbol, candles] of historicalData) {
        const candle = candles.find(c => c.openTime === timestamp);
        if (candle) {
          currentCandles.set(symbol, candle);
        }
      }

      // Skip if no data available for any symbol
      if (currentCandles.size === 0) continue;

      try {
        // Execute strategy for current market state
        const signals = executeStrategy(ast, currentCandles, positions);

        // Process trading signals
        for (const signal of signals) {
          if (signal.action === 'BUY' || signal.action === 'SELL') {
            const trade = await this.executeTrade(
              signal,
              currentCandles,
              config,
              currentCapital,
              positions,
              backtestId
            );

            if (trade) {
              trades.push(trade);
              currentCapital += trade.pnl || 0;
              
              // Update position
              this.updatePosition(positions, trade);
              
              // Save trade to database
              await this.saveTrade(trade, backtestId);
            }
          }
        }

        // Record equity point
        equityCurve.push({
          timestamp,
          equity: currentCapital
        });

      } catch (error) {
        console.error(`Error executing strategy at timestamp ${timestamp}:`, error);
        // Continue with next timestamp
      }
    }

    return { trades, equityCurve };
  }

  /**
   * Execute a trade based on a signal
   */
  private async executeTrade(
    signal: any,
    currentCandles: Map<string, BybitCandle>,
    config: BacktestConfig,
    currentCapital: number,
    positions: Map<string, { quantity: number; avgPrice: number }>,
    backtestId: number
  ): Promise<Trade | null> {
    const candle = currentCandles.get(signal.symbol);
    if (!candle) return null;

    const price = parseFloat(candle.close);
    const riskAmount = currentCapital * (config.riskPerTrade / 100);
    const quantity = signal.quantity || (riskAmount / price);
    const fee = quantity * price * config.commission;

    const trade: Trade = {
      symbol: signal.symbol,
      side: signal.action === 'BUY' ? 'Buy' : 'Sell',
      type: 'Market',
      quantity,
      price,
      fee,
      executedAt: new Date(candle.openTime),
      metadata: {
        backtestId,
        signal: signal
      }
    };

    // Calculate P&L (simplified - in reality this would be more complex)
    const currentPosition = positions.get(signal.symbol);
    if (currentPosition && trade.side === 'Sell') {
      // Closing position
      const pnl = (price - currentPosition.avgPrice) * Math.min(quantity, currentPosition.quantity) - fee;
      trade.pnl = pnl;
    } else if (trade.side === 'Buy') {
      // Opening position
      trade.pnl = -fee; // Just the fee cost for now
    }

    return trade;
  }

  /**
   * Update position after a trade
   */
  private updatePosition(
    positions: Map<string, { quantity: number; avgPrice: number }>,
    trade: Trade
  ): void {
    const currentPosition = positions.get(trade.symbol) || { quantity: 0, avgPrice: 0 };

    if (trade.side === 'Buy') {
      // Add to position
      const totalCost = (currentPosition.quantity * currentPosition.avgPrice) + (trade.quantity * trade.price);
      const totalQuantity = currentPosition.quantity + trade.quantity;
      positions.set(trade.symbol, {
        quantity: totalQuantity,
        avgPrice: totalQuantity > 0 ? totalCost / totalQuantity : 0
      });
    } else if (trade.side === 'Sell') {
      // Reduce position
      const newQuantity = Math.max(0, currentPosition.quantity - trade.quantity);
      positions.set(trade.symbol, {
        quantity: newQuantity,
        avgPrice: currentPosition.avgPrice
      });
    }
  }

  /**
   * Calculate backtest metrics
   */
  private calculateMetrics(trades: Trade[], initialCapital: number): BacktestMetrics {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        sharpeRatio: 0,
        profitFactor: 0,
        avgWinningTrade: 0,
        avgLosingTrade: 0,
        maxWinningStreak: 0,
        maxLosingStreak: 0,
        totalFees: 0
      };
    }

    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalFees = trades.reduce((sum, t) => sum + t.fee, 0);
    const winSum = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const lossSum = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));

    // Calculate streaks
    let maxWinningStreak = 0;
    let maxLosingStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    trades.forEach(trade => {
      if ((trade.pnl || 0) > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinningStreak = Math.max(maxWinningStreak, currentWinStreak);
      } else if ((trade.pnl || 0) < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLosingStreak = Math.max(maxLosingStreak, currentLossStreak);
      }
    });

    // Calculate drawdown (simplified)
    let peak = initialCapital;
    let maxDrawdown = 0;
    let runningCapital = initialCapital;

    trades.forEach(trade => {
      runningCapital += (trade.pnl || 0);
      peak = Math.max(peak, runningCapital);
      const drawdown = peak - runningCapital;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / trades.length) * 100,
      totalReturn: totalPnL,
      totalReturnPercent: (totalPnL / initialCapital) * 100,
      maxDrawdown,
      maxDrawdownPercent: (maxDrawdown / initialCapital) * 100,
      sharpeRatio: this.calculateSharpeRatio(trades, initialCapital),
      profitFactor: lossSum > 0 ? winSum / lossSum : winSum > 0 ? Infinity : 0,
      avgWinningTrade: winningTrades.length > 0 ? winSum / winningTrades.length : 0,
      avgLosingTrade: losingTrades.length > 0 ? lossSum / losingTrades.length : 0,
      maxWinningStreak,
      maxLosingStreak,
      totalFees
    };
  }

  /**
   * Calculate Sharpe ratio (simplified)
   */
  private calculateSharpeRatio(trades: Trade[], initialCapital: number): number {
    if (trades.length === 0) return 0;

    const returns = trades.map(t => (t.pnl || 0) / initialCapital);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  // Database methods

  private async createBacktestRecord(config: BacktestConfig, strategyId?: number): Promise<number> {
    const [id] = await this.db('backtests').insert({
      name: `Backtest ${new Date().toISOString()}`,
      strategy_id: strategyId,
      config: JSON.stringify(config),
      status: 'pending',
      start_date: config.startDate,
      end_date: config.endDate,
      initial_capital: config.initialCapital
    }).returning('id');
    
    return typeof id === 'object' ? id.id : id;
  }

  private async updateBacktestStatus(backtestId: number, status: string): Promise<void> {
    await this.db('backtests')
      .where('id', backtestId)
      .update({ status, updated_at: new Date() });
  }

  private async updateBacktestResults(backtestId: number, result: BacktestResult): Promise<void> {
    await this.db('backtests')
      .where('id', backtestId)
      .update({
        status: result.status,
        metrics: JSON.stringify(result.metrics),
        results: JSON.stringify({
          equityCurve: result.equityCurve,
          totalTrades: result.trades.length
        }),
        updated_at: new Date()
      });
  }

  private async saveTrade(trade: Trade, backtestId: number): Promise<void> {
    await this.db('trades').insert({
      backtest_id: backtestId,
      symbol: trade.symbol,
      side: trade.side.toLowerCase(),
      type: trade.type.toLowerCase(),
      quantity: trade.quantity,
      price: trade.price,
      fee: trade.fee,
      executed_at: trade.executedAt,
      status: 'filled',
      metadata: JSON.stringify(trade.metadata),
      pnl: trade.pnl
    });
  }

  /**
   * Get backtest results by ID
   */
  async getBacktestResult(backtestId: number): Promise<BacktestResult | null> {
    const backtest = await this.db('backtests')
      .where('id', backtestId)
      .first();

    if (!backtest) return null;

    const trades = await this.db('trades')
      .where('backtest_id', backtestId)
      .select('*');

    return {
      id: backtest.id,
      strategyId: backtest.strategy_id,
      name: backtest.name,
      config: JSON.parse(backtest.config),
      status: backtest.status,
      trades: trades.map((t: any) => ({
        id: t.id,
        symbol: t.symbol,
        side: t.side === 'buy' ? 'Buy' : 'Sell',
        type: t.type === 'market' ? 'Market' : 'Limit',
        quantity: parseFloat(t.quantity),
        price: parseFloat(t.price),
        fee: parseFloat(t.fee),
        executedAt: new Date(t.executed_at),
        pnl: t.pnl ? parseFloat(t.pnl) : undefined,
        metadata: t.metadata ? JSON.parse(t.metadata) : undefined
      })),
      metrics: backtest.metrics ? JSON.parse(backtest.metrics) : {},
      equityCurve: backtest.results ? JSON.parse(backtest.results).equityCurve || [] : [],
      startDate: new Date(backtest.start_date),
      endDate: new Date(backtest.end_date),
      initialCapital: parseFloat(backtest.initial_capital)
    };
  }

  /**
   * List all backtests
   */
  async listBacktests(): Promise<BacktestResult[]> {
    const backtests = await this.db('backtests')
      .select('*')
      .orderBy('created_at', 'desc');

    return Promise.all(backtests.map((b: any) => this.getBacktestResult(b.id)));
  }
}
