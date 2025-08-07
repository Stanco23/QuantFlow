import { BybitClient } from './bybitClient';
import { parseDSL, executeStrategy } from '@quantflow/shared';
import db from '../database/connection';
import WebSocket from 'ws';

export interface LiveTradingConfig {
  strategyId: number;
  strategyCode: string;
  symbols: string[];
  timeframe: string;
  riskPerTrade: number;
  tradeSize: number; // in units of the base currency
}

export class LiveTradingEngine {
  private bybitClient: BybitClient;
  private db: any;
  private ws: WebSocket | null = null;
  private activeStrategies: Map<number, LiveTradingConfig> = new Map();

  constructor(bybitClient: BybitClient) {
    this.bybitClient = bybitClient;
    this.db = db;
  }

  /**
   * Start live trading for a strategy
   */
  async start(config: LiveTradingConfig): Promise<void> {
    if (this.activeStrategies.has(config.strategyId)) {
      throw new Error(`Strategy ${config.strategyId} is already running.`);
    }

    this.activeStrategies.set(config.strategyId, config);
    this.ensureWebSocketConnection();
    this.subscribeToSymbols(config.symbols);

    console.log(`Started live trading for strategy ${config.strategyId} on symbols: ${config.symbols.join(', ')}`);
  }

  /**
   * Stop live trading for a strategy
   */
  async stop(strategyId: number): Promise<void> {
    const config = this.activeStrategies.get(strategyId);
    if (!config) {
      throw new Error(`Strategy ${strategyId} is not running.`);
    }

    this.unsubscribeFromSymbols(config.symbols);
    this.activeStrategies.delete(strategyId);

    console.log(`Stopped live trading for strategy ${strategyId}`);
  }

  /**
   * Ensure WebSocket connection is active
   */
  private ensureWebSocketConnection(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = this.bybitClient.getWebSocketUrl();
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log('Bybit WebSocket connection opened.');
      this.authenticate();
      // Resubscribe to all symbols on reconnection
      const allSymbols = new Set<string>();
      this.activeStrategies.forEach(config => {
        config.symbols.forEach(symbol => allSymbols.add(symbol));
      });
      this.subscribeToSymbols(Array.from(allSymbols));
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      this.handleWebSocketMessage(data.toString());
    });

    this.ws.on('close', () => {
      console.log('Bybit WebSocket connection closed. Reconnecting...');
      setTimeout(() => this.ensureWebSocketConnection(), 5000);
    });

    this.ws.on('error', (error: Error) => {
      console.error('Bybit WebSocket error:', error);
    });
  }

  /**
   * Authenticate WebSocket connection
   */
  private authenticate(): void {
    const { apiKey, expires, signature } = this.bybitClient.getWebSocketAuth();
    const authRequest = {
      op: 'auth',
      args: [apiKey, expires, signature]
    };
    this.ws?.send(JSON.stringify(authRequest));
  }

  /**
   * Subscribe to market data for symbols
   */
  private subscribeToSymbols(symbols: string[]): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    const subscription = {
      op: 'subscribe',
      args: symbols.map(symbol => `kline.1.${symbol}`)
    };
    this.ws.send(JSON.stringify(subscription));
  }

  /**
   * Unsubscribe from market data for symbols
   */
  private unsubscribeFromSymbols(symbols: string[]): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    const subscription = {
      op: 'unsubscribe',
      args: symbols.map(symbol => `kline.1.${symbol}`)
    };
    this.ws.send(JSON.stringify(subscription));
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleWebSocketMessage(data: string): Promise<void> {
    const message = JSON.parse(data);

    if (message.topic && message.topic.startsWith('kline')) {
      const candleData = message.data[0];
      const symbol = message.topic.split('.')[2];

      // Find strategies that are subscribed to this symbol
      for (const [strategyId, config] of this.activeStrategies.entries()) {
        if (config.symbols.includes(symbol)) {
          await this.processCandle(config, candleData, symbol);
        }
      }
    }
  }

  /**
   * Process a new candle from the WebSocket feed
   */
  private async processCandle(config: LiveTradingConfig, candle: any, symbol: string): Promise<void> {
    try {
      // Parse the strategy DSL
      const { ast, errors } = parseDSL(config.strategyCode);
      if (errors && errors.length > 0) {
        console.error(`Strategy ${config.strategyId} parsing errors:`, errors);
        return;
      }

      // Get current market state
      const currentCandles = new Map<string, any>();
      currentCandles.set(symbol, {
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        turnover: candle.turnover
      });

      // Get current positions
      const positions = await this.bybitClient.getPositions();
      const positionMap = new Map<string, any>();
      positions.forEach(p => positionMap.set(p.symbol, p));

      // Execute strategy
      if (ast) {
        const signals = executeStrategy(ast, currentCandles, positionMap);

        // Process signals
        for (const signal of signals) {
          await this.executeLiveTrade(signal, config);
        }
      }

    } catch (error) {
      console.error(`Error processing candle for strategy ${config.strategyId}:`, error);
    }
  }

  /**
   * Execute a live trade based on a signal
   */
  private async executeLiveTrade(signal: any, config: LiveTradingConfig): Promise<void> {
    try {
      const order = {
        symbol: signal.symbol,
        side: (signal.action === 'BUY' ? 'Buy' : 'Sell') as 'Buy' | 'Sell',
        orderType: 'Market' as const,
        qty: (config.tradeSize).toString()
      };

      const result = await this.bybitClient.placeOrder(order);

      // Log the trade
      await this.db('trades').insert({
        strategy_id: config.strategyId,
        symbol: order.symbol,
        side: order.side.toLowerCase(),
        type: order.orderType.toLowerCase(),
        quantity: config.tradeSize,
        price: parseFloat(result.result.price),
        fee: parseFloat(result.result.cumExecFee),
        executed_at: new Date(),
        status: 'filled',
        metadata: JSON.stringify({ liveTrade: true, orderId: result.result.orderId })
      });

      console.log(`Executed live trade for strategy ${config.strategyId}:`, order);

    } catch (error) {
      console.error(`Failed to execute live trade for strategy ${config.strategyId}:`, error);
    }
  }

  /**
   * Get all active strategies
   */
  getActiveStrategies(): Map<number, LiveTradingConfig> {
    return this.activeStrategies;
  }

  /**
   * Get status of all active strategies
   */
  getStatus(): { [key: number]: { status: string; config: LiveTradingConfig } } {
    const status: { [key: number]: { status: string; config: LiveTradingConfig } } = {};
    this.activeStrategies.forEach((config, strategyId) => {
      status[strategyId] = { status: 'running', config };
    });
    return status;
  }
}

