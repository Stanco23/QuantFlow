import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { CandlestickData } from '../components/Chart';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types for API responses
export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  type: 'market' | 'limit' | 'stop';
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  type: 'market' | 'limit' | 'stop';
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  timestamp: string;
}

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

// Backend interfaces
export interface BacktestConfig {
  strategyCode: string;
  symbols: string[];
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  riskPerTrade: number;
  commission: number;
}

export interface BacktestResult {
  id: number;
  name: string;
  config: BacktestConfig;
  status: string;
  metrics: any;
  trades: any[];
  equityCurve: Array<{ timestamp: number; equity: number }>;
}

export interface PortfolioSummary {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  positions: any[];
  balance: any[];
}

export interface LiveTradingStatus {
  totalActiveStrategies: number;
  strategies: Array<{
    strategyId: number;
    symbols: string[];
    status: string;
  }>;
}

export interface Strategy {
  id: number;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

// API service methods
export const apiService = {
  // Exchange endpoints (real backend)
  async getTicker(symbol: string): Promise<any> {
    const response = await api.get(`/exchange/ticker/${symbol}`);
    return response.data.data;
  },

  async getHistoricalData(symbol: string, interval: string, limit: number = 100): Promise<any[]> {
    const response = await api.get('/exchange/historical', {
      params: { symbol, interval, limit }
    });
    return response.data.data;
  },

  async getCandlestickData(
    symbol: string, 
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      // Convert display format (BTC/USD) to API format (BTCUSDT)
      const apiSymbol = symbol.replace('/', '').replace('USD', 'USDT');
      
      // Map frontend intervals to Bybit API intervals
      const intervalMap: Record<string, string> = {
        '1m': '1',
        '5m': '5', 
        '15m': '15',
        '1h': '60',
        '4h': '240',
        '1d': 'D'
      };
      
      const apiInterval = intervalMap[interval] || '60';
      const data = await this.getHistoricalData(apiSymbol, apiInterval, limit);
      return data.map(candle => ({
        time: Math.floor(candle.openTime / 1000) as any,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
      }));
    } catch (error) {
      // Return empty array if API fails
      return [];
    }
  },

  async getSymbols(): Promise<string[]> {
    const response = await api.get('/exchange/symbols');
    // Map response.data.data to string[] of display symbols
    return response.data.data.map((symbol: string) => 
      symbol.replace('USDT', '/USD')
    );
  },

  async getAllMarketData(): Promise<MarketData[]> {
    try {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'];
      const marketData = await Promise.all(
        symbols.map(async symbol => {
          const ticker = await this.getTicker(symbol);
          return {
            symbol: symbol.replace('USDT', '/USD'),
            price: parseFloat(ticker.lastPrice),
            change: parseFloat(ticker.priceChangePercent),
            changePercent: parseFloat(ticker.priceChangePercent),
            volume: parseFloat(ticker.volume24h),
            high24h: parseFloat(ticker.highPrice24h || ticker.lastPrice),
            low24h: parseFloat(ticker.lowPrice24h || ticker.lastPrice),
            timestamp: new Date().toISOString()
          };
        })
      );
      return marketData;
    } catch (error) {
      // Return empty array if API fails
      return [];
    }
  },

  // Order Management endpoints
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await api.post<Order>('/orders', orderData);
    return response.data;
  },

  async getOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders');
    return response.data;
  },

  async getOrder(orderId: string): Promise<Order> {
    const response = await api.get<Order>(`/orders/${orderId}`);
    return response.data;
  },

  async cancelOrder(orderId: string): Promise<Order> {
    const response = await api.delete<Order>(`/orders/${orderId}`);
    return response.data;
  },

  async getOrderHistory(): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders/history');
    return response.data;
  },

  // Portfolio Management endpoints
  async getPositions(): Promise<Position[]> {
    const response = await api.get<Position[]>('/portfolio/positions');
    return response.data;
  },

  async getPosition(symbol: string): Promise<Position> {
    const response = await api.get<Position>(`/portfolio/positions/${symbol}`);
    return response.data;
  },

  async getPortfolioSummary(): Promise<{
    totalValue: number;
    totalPnl: number;
    totalPnlPercent: number;
    positions: number;
  }> {
    const response = await api.get('/portfolio/summary');
    return response.data;
  },

  // Strategy Management
  async validateStrategy(strategyCode: string): Promise<{ ast: any; errors: string[] }> {
    const response = await api.post('/parser/validate', { code: strategyCode });
    return response.data;
  },

  async getStrategies(): Promise<Strategy[]> {
    const response = await api.get('/strategies');
    return response.data.data;
  },

  async createStrategy(strategyData: { name: string; code: string }): Promise<Strategy> {
    const response = await api.post('/strategies', strategyData);
    return response.data.data;
  },

  async updateStrategy(id: number, strategyData: { name: string; code: string }): Promise<Strategy> {
    const response = await api.put(`/strategies/${id}`, strategyData);
    return response.data.data;
  },

  async deleteStrategy(id: number): Promise<void> {
    await api.delete(`/strategies/${id}`);
  },

  // Backtesting endpoints
  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    const response = await api.post('/backtest', config);
    return response.data.data;
  },

  async getBacktests(): Promise<BacktestResult[]> {
    const response = await api.get('/backtest');
    return response.data.data;
  },

  async getBacktest(id: number): Promise<BacktestResult> {
    const response = await api.get(`/backtest/${id}`);
    return response.data.data;
  },

  async runQuickBacktest(strategyCode: string, symbol: string): Promise<BacktestResult> {
    const response = await api.post('/backtest/quick', {
      strategyCode,
      symbol: symbol.replace('/', '')
    });
    return response.data.data;
  },

  // Portfolio endpoints
  async getPortfolioPositions(): Promise<any[]> {
    const response = await api.get('/portfolio/positions');
    return response.data.data?.positions || [];
  },

  async getPortfolioBalance(): Promise<any[]> {
    const response = await api.get('/portfolio/balance');
    return response.data.data?.balances || [];
  },

  async getPortfolioRisk(): Promise<any> {
    const response = await api.get('/portfolio/risk');
    return response.data.data;
  },

  async getPortfolio(): Promise<PortfolioSummary> {
    const response = await api.get('/portfolio/summary');
    return response.data.data?.summary || {};
  },

  // Live Trading endpoints
  async startLiveTrading(config: {
    strategyId: number;
    strategyCode: string;
    symbols: string[];
    timeframe: string;
    riskPerTrade: number;
    tradeSize: number;
  }): Promise<any> {
    const response = await api.post('/live/start', config);
    return response.data;
  },

  async stopLiveTrading(strategyId: number): Promise<any> {
    const response = await api.post('/live/stop', { strategyId });
    return response.data;
  },

  async getLiveTradingStatus(): Promise<LiveTradingStatus> {
    const response = await api.get('/live/status');
    return response.data.data;
  },

  async stopAllLiveTrading(): Promise<any> {
    const response = await api.delete('/live/stop-all');
    return response.data;
  },

  // WebSocket connection for real-time data
  createWebSocketConnection(): WebSocket {
    const wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api', '') + '/ws';
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected to QuantFlow');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return ws;
  },

  // Subscribe to symbol ticker data via WebSocket
  subscribeToSymbol(ws: WebSocket, symbol: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'subscribe',
        symbol: symbol.replace('/', '').replace('USD', 'USDT')
      }));
    }
  },

  // Unsubscribe from symbol ticker data via WebSocket
  unsubscribeFromSymbol(ws: WebSocket, symbol: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'unsubscribe',
        symbol: symbol.replace('/', '').replace('USD', 'USDT')
      }));
    }
  },
};

// Export the axios instance for custom requests
export { api };
export default apiService;
