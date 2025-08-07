/**
 * Core data types for the QuantFlow trading system
 */
export interface Candle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export interface Order {
    id?: string;
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop';
    quantity: number;
    price?: number;
    stopPrice?: number;
    timestamp: number;
    status: 'pending' | 'filled' | 'cancelled' | 'rejected';
    fillPrice?: number;
    fillQuantity?: number;
    strategyId?: string;
}
export interface StrategyConfig {
    id: string;
    name: string;
    symbol: string;
    timeframe: string;
    parameters: Record<string, any>;
    expression: string;
    enabled: boolean;
    riskManagement: {
        maxPositionSize: number;
        stopLoss?: number;
        takeProfit?: number;
        maxDrawdown?: number;
    };
    created: number;
    updated: number;
}
export interface BacktestResult {
    strategyId: string;
    symbol: string;
    timeframe: string;
    startDate: number;
    endDate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    avgTradeReturn: number;
    winRate: number;
    profitFactor: number;
    trades: Order[];
    equity: Array<{
        timestamp: number;
        value: number;
    }>;
    created: number;
}
export interface Position {
    symbol: string;
    side: 'long' | 'short';
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPnl: number;
    timestamp: number;
}
export interface MarketData {
    symbol: string;
    candles: Candle[];
    lastUpdate: number;
}
//# sourceMappingURL=types.d.ts.map