import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import crypto from 'crypto';

// Error classes for consistent error handling
export class BybitApiError extends Error {
  public readonly code: number;
  public readonly response?: any;
  
  constructor(message: string, code: number, response?: any) {
    super(message);
    this.name = 'BybitApiError';
    this.code = code;
    this.response = response;
  }
}

export class BybitNetworkError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'BybitNetworkError';
  }
}

export class BybitSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BybitSignatureError';
  }
}

export interface BybitOrder {
  symbol: string;
  side: 'Buy' | 'Sell';
  orderType: 'Market' | 'Limit';
  qty: string;
  price?: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface BybitBalance {
  coin: string;
  free: string;
  used: string;
  total: string;
}

export interface BybitTicker {
  symbol: string;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  volume24h: string;
  priceChangePercent: string;
}

export interface BybitCandle {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

export interface BybitPosition {
  symbol: string;
  side: 'Buy' | 'Sell' | 'None';
  size: string;
  positionValue: string;
  entryPrice: string;
  markPrice: string;
  unrealizedPnl: string;
  percentage: string;
}

export interface BybitMarketData {
  symbol: string;
  lastPrice: string;
  prevPrice24h: string;
  price24hPcnt: string;
  highPrice24h: string;
  lowPrice24h: string;
  volume24h: string;
  turnover24h: string;
}

export class BybitClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private wsBaseUrl: string;
  private axiosInstance: AxiosInstance;

  /**
   * Creates a new Bybit API client instance
   * @param apiKey The Bybit API key
   * @param apiSecret The Bybit API secret
   * @param testnet Whether to use testnet (default: false)
   */
  constructor(apiKey: string, apiSecret: string, testnet: boolean = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = testnet 
      ? 'https://api-testnet.bybit.com' 
      : 'https://api.bybit.com';
    this.wsBaseUrl = testnet
      ? 'wss://stream-testnet.bybit.com/v5/public/spot'
      : 'wss://stream.bybit.com/v5/public/spot';

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generates a HMAC SHA256 signature for Bybit API authentication
   * @param params Request parameters
   * @param timestamp Current timestamp in milliseconds
   * @returns Signature string
   */
  private generateSignature(params: Record<string, any>, timestamp: number): string {
    try {
      const queryString = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
      
      const signaturePayload = `${timestamp}${this.apiKey}${queryString}`;
      
      return crypto
        .createHmac('sha256', this.apiSecret)
        .update(signaturePayload)
        .digest('hex');
    } catch (error) {
      throw new BybitSignatureError(`Failed to generate signature: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Makes a request to the Bybit API
   * @param method HTTP method
   * @param endpoint API endpoint
   * @param params Request parameters
   * @returns API response data
   */
  private async makeRequest(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    const timestamp = Date.now();
    const signature = this.generateSignature(params, timestamp);

    const config: AxiosRequestConfig = {
      method,
      url: endpoint,
      headers: {
        'X-BAPI-API-KEY': this.apiKey,
        'X-BAPI-SIGN': signature,
        'X-BAPI-SIGN-TYPE': '2',
        'X-BAPI-TIMESTAMP': timestamp.toString(),
      },
    };

    if (method === 'GET') {
      config.params = params;
    } else {
      config.data = params;
    }

    try {
      const response = await this.axiosInstance(config);
      
      if (response.data.retCode !== 0) {
        throw new BybitApiError(
          `Bybit API Error (${response.data.retCode}): ${response.data.retMsg}`,
          response.data.retCode,
          response.data
        );
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new BybitApiError(
            `HTTP Error ${error.response.status}: ${error.message}`,
            error.response.status,
            error.response.data
          );
        } else {
          throw new BybitNetworkError(`Network Error: ${error.message}`, error);
        }
      }
      throw error;
    }
  }

  /**
   * Makes a public API request (no authentication required)
   * @param method HTTP method
   * @param endpoint API endpoint
   * @param params Request parameters
   * @returns API response data
   */
  private async makePublicRequest(
    method: 'GET' | 'POST' = 'GET',
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    const config: AxiosRequestConfig = {
      method,
      url: endpoint,
    };

    if (method === 'GET') {
      config.params = params;
    } else {
      config.data = params;
    }

    try {
      const response = await this.axiosInstance(config);
      
      if (response.data.retCode !== 0) {
        throw new BybitApiError(
          `Bybit API Error (${response.data.retCode}): ${response.data.retMsg}`,
          response.data.retCode,
          response.data
        );
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new BybitApiError(
            `HTTP Error ${error.response.status}: ${error.message}`,
            error.response.status,
            error.response.data
          );
        } else {
          throw new BybitNetworkError(`Network Error: ${error.message}`, error);
        }
      }
      throw error;
    }
  }

  /**
   * Get market data for a specific symbol or all symbols
   * @param symbol Optional symbol to get market data for (if not provided, returns data for all symbols)
   * @param category Market category (default: 'spot')
   * @returns Market data
   */
  async getMarketData(symbol?: string, category: string = 'spot'): Promise<BybitMarketData[]> {
    const params: Record<string, any> = { category };
    if (symbol) params.symbol = symbol;

    const response = await this.makeRequest('GET', '/v5/market/tickers', params);
    
    return response.result.list.map((item: any) => ({
      symbol: item.symbol,
      lastPrice: item.lastPrice,
      prevPrice24h: item.prevPrice24h,
      price24hPcnt: item.price24hPcnt,
      highPrice24h: item.highPrice24h,
      lowPrice24h: item.lowPrice24h,
      volume24h: item.volume24h,
      turnover24h: item.turnover24h
    }));
  }

  /**
   * Place a new order
   * @param order Order details
   * @returns Order response
   */
  async placeOrder(order: BybitOrder): Promise<any> {
    return await this.makeRequest('POST', '/v5/order/create', {
      category: 'spot',
      symbol: order.symbol,
      side: order.side,
      orderType: order.orderType,
      qty: order.qty,
      price: order.price,
      timeInForce: order.timeInForce || 'GTC',
    });
  }

  /**
   * Cancel an existing order
   * @param symbol Symbol of the order
   * @param orderId Order ID to cancel
   * @returns Cancel response
   */
  async cancelOrder(symbol: string, orderId: string): Promise<any> {
    return await this.makeRequest('POST', '/v5/order/cancel', {
      category: 'spot',
      symbol,
      orderId,
    });
  }

  /**
   * Get account balance information
   * @returns Array of balance information for each coin
   */
  async getBalance(): Promise<BybitBalance[]> {
    const response = await this.makeRequest('GET', '/v5/account/wallet-balance', {
      accountType: 'SPOT',
    });

    return response.result.list[0]?.coin?.map((coin: any) => ({
      coin: coin.coin,
      free: coin.free,
      used: coin.locked,
      total: coin.walletBalance,
    })) || [];
  }

  /**
   * Get ticker information for a specific symbol
   * @param symbol Trading pair symbol
   * @returns Ticker information
   */
  async getTicker(symbol: string): Promise<BybitTicker> {
    const response = await this.makePublicRequest('GET', '/v5/market/tickers', {
      category: 'spot',
      symbol,
    });

    const ticker = response.result.list[0];
    return {
      symbol: ticker.symbol,
      lastPrice: ticker.lastPrice,
      bidPrice: ticker.bid1Price,
      askPrice: ticker.ask1Price,
      volume24h: ticker.volume24h,
      priceChangePercent: ticker.price24hPcnt,
    };
  }

  /**
   * Get historical candle data
   * @param symbol Trading pair symbol
   * @param interval Time interval (e.g., '1', '5', '15', '30', '60', '240', 'D', 'W', 'M')
   * @param start Optional start timestamp
   * @param end Optional end timestamp
   * @param limit Number of candles to return (default: 200, max: 1000)
   * @returns Array of candle data
   */
  async getHistorical(
    symbol: string,
    interval: string,
    start?: number,
    end?: number,
    limit: number = 200
  ): Promise<BybitCandle[]> {
    const params: Record<string, any> = {
      category: 'spot',
      symbol,
      interval,
      limit,
    };

    if (start) params.start = start;
    if (end) params.end = end;

    const response = await this.makePublicRequest('GET', '/v5/market/kline', params);

    return response.result.list.map((candle: string[]) => ({
      openTime: parseInt(candle[0]),
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
      closeTime: parseInt(candle[0]) + parseInt(interval) * 60 * 1000, // Approximate close time
    }));
  }
  
  /**
   * Alias for getHistorical to maintain backward compatibility
   */
  async getHistoricalCandles(
    symbol: string,
    interval: string,
    start?: number,
    end?: number,
    limit: number = 200
  ): Promise<BybitCandle[]> {
    return this.getHistorical(symbol, interval, start, end, limit);
  }
  
  /**
   * Get all open positions
   * @param category Position category (default: 'linear')
   * @param symbol Optional symbol to filter positions
   * @returns Array of positions
   */
  async getPositions(category: string = 'linear', symbol?: string): Promise<BybitPosition[]> {
    const params: Record<string, any> = { category };
    if (symbol) params.symbol = symbol;
    
    const response = await this.makeRequest('GET', '/v5/position/list', params);
    
    return response.result.list.map((position: any) => ({
      symbol: position.symbol,
      side: position.side,
      size: position.size,
      positionValue: position.positionValue,
      entryPrice: position.entryPrice,
      markPrice: position.markPrice,
      unrealizedPnl: position.unrealisedPnl,
      percentage: ((parseFloat(position.markPrice) / parseFloat(position.entryPrice) - 1) * 100).toFixed(2)
    }));
  }

  /**
   * Get WebSocket URL for real-time data
   */
  getWebSocketUrl(): string {
    return this.wsBaseUrl;
  }

  /**
   * Generate WebSocket authentication parameters
   */
  getWebSocketAuth(): { apiKey: string; expires: number; signature: string } {
    const expires = Date.now() + 10000; // 10 seconds from now
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(`GET/realtime${expires}`)
      .digest('hex');
    
    return {
      apiKey: this.apiKey,
      expires,
      signature
    };
  }
}
