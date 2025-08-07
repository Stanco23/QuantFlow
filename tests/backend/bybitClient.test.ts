/**
 * Unit tests for Bybit API Client
 */

import { BybitClient, BybitApiError, BybitNetworkError, BybitSignatureError, BybitCandle, BybitOrder, BybitPosition, BybitMarketData } from '../../backend/src/services/bybitClient';
import axios from 'axios';
import crypto from 'crypto';

// Mock axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const API_KEY = 'test_api_key';
const API_SECRET = 'test_api_secret';
const BASE_URL = 'https://api.bybit.com';

describe('BybitClient', () => {
  let client: BybitClient;
  let axiosInstanceMock: any;

  beforeEach(() => {
    jest.resetAllMocks();
    
    // Mock axios instance - it's a function that can be called with config
    axiosInstanceMock = jest.fn();
    axiosInstanceMock.get = jest.fn();
    axiosInstanceMock.post = jest.fn();
    axiosInstanceMock.delete = jest.fn();
    
    mockedAxios.create.mockReturnValue(axiosInstanceMock);
    
    client = new BybitClient(API_KEY, API_SECRET, false);
  });

  describe('constructor', () => {
    it('should create instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.bybit.com',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should use testnet URL when testnet is true', () => {
      new BybitClient(API_KEY, API_SECRET, true);
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api-testnet.bybit.com'
        })
      );
    });
  });

  describe('signature generation', () => {
    it('should generate valid HMAC SHA256 signature', () => {
      const params = { symbol: 'BTCUSDT', category: 'spot' };
      const timestamp = 1622505600000;
      
      // Access private method via bracket notation for testing
      const signature = (client as any).generateSignature(params, timestamp);
      
      // Manually calculate expected signature
      const queryString = 'category=spot&symbol=BTCUSDT';
      const signaturePayload = `${timestamp}${API_KEY}${queryString}`;
      const expectedSignature = crypto
        .createHmac('sha256', API_SECRET)
        .update(signaturePayload)
        .digest('hex');
      
      expect(signature).toBe(expectedSignature);
      expect(typeof signature).toBe('string');
      expect(signature).toHaveLength(64); // SHA256 hex digest length
    });
  });

  describe('getMarketData', () => {
    it('should return market data for all symbols', async () => {
      const mockResponse = {
        data: {
          retCode: 0,
          retMsg: 'OK',
          result: {
            list: [
              {
                symbol: 'BTCUSDT',
                lastPrice: '30000',
                prevPrice24h: '29000',
                price24hPcnt: '0.0344',
                highPrice24h: '31000',
                lowPrice24h: '28000',
                volume24h: '1000',
                turnover24h: '30000000'
              }
            ]
          }
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      const marketData: BybitMarketData[] = await client.getMarketData();
      
      expect(marketData).toHaveLength(1);
      expect(marketData[0].symbol).toBe('BTCUSDT');
      expect(marketData[0].lastPrice).toBe('30000');
      expect(marketData[0].price24hPcnt).toBe('0.0344');
    });

    it('should return market data for specific symbol', async () => {
      const mockResponse = {
        data: {
          retCode: 0,
          retMsg: 'OK',
          result: {
            list: [
              {
                symbol: 'ETHUSDT',
                lastPrice: '2000',
                prevPrice24h: '1900',
                price24hPcnt: '0.0526',
                highPrice24h: '2100',
                lowPrice24h: '1800',
                volume24h: '5000',
                turnover24h: '10000000'
              }
            ]
          }
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      const marketData = await client.getMarketData('ETHUSDT');
      
      expect(marketData).toHaveLength(1);
      expect(marketData[0].symbol).toBe('ETHUSDT');
    });
  });

  describe('getHistorical', () => {
    it('should return historical candle data', async () => {
      const mockResponse = {
        data: {
          retCode: 0,
          retMsg: 'OK',
          result: {
            list: [
              [
                '1622505600000',
                '30000',
                '31000',
                '29000',
                '30500',
                '1000'
              ],
              [
                '1622419200000',
                '29500',
                '30200',
                '29000',
                '30000',
                '800'
              ]
            ]
          }
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      const candles: BybitCandle[] = await client.getHistorical('BTCUSDT', 'D');
      
      expect(candles).toHaveLength(2);
      expect(candles[0].open).toBe('30000');
      expect(candles[0].high).toBe('31000');
      expect(candles[0].low).toBe('29000');
      expect(candles[0].close).toBe('30500');
      expect(candles[0].volume).toBe('1000');
      expect(candles[0].openTime).toBe(1622505600000);
    });

    it('should handle parameters correctly', async () => {
      const mockResponse = {
        data: {
          retCode: 0,
          retMsg: 'OK',
          result: { list: [] }
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      await client.getHistorical('BTCUSDT', '1h', 1622505600000, 1622592000000, 100);
      
      expect(axiosInstanceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/v5/market/kline',
          params: {
            category: 'spot',
            symbol: 'BTCUSDT',
            interval: '1h',
            limit: 100,
            start: 1622505600000,
            end: 1622592000000
          }
        })
      );
    });
  });

  describe('placeOrder', () => {
    it('should place a market order', async () => {
      const order: BybitOrder = {
        symbol: 'BTCUSDT',
        side: 'Buy',
        orderType: 'Market',
        qty: '0.1'
      };

      const mockResponse = {
        data: {
          retCode: 0,
          retMsg: 'OK',
          result: { orderId: '12345', orderLinkId: 'test-123' }
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      const response = await client.placeOrder(order);
      
      expect(response.result.orderId).toBe('12345');
      expect(axiosInstanceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/v5/order/create',
          data: {
            category: 'spot',
            symbol: 'BTCUSDT',
            side: 'Buy',
            orderType: 'Market',
            qty: '0.1',
            price: undefined,
            timeInForce: 'GTC'
          }
        })
      );
    });

    it('should place a limit order with price', async () => {
      const order: BybitOrder = {
        symbol: 'BTCUSDT',
        side: 'Sell',
        orderType: 'Limit',
        qty: '0.05',
        price: '31000',
        timeInForce: 'IOC'
      };

      const mockResponse = {
        data: {
          retCode: 0,
          retMsg: 'OK',
          result: { orderId: '67890' }
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      const response = await client.placeOrder(order);
      
      expect(response.result.orderId).toBe('67890');
      expect(axiosInstanceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            price: '31000',
            timeInForce: 'IOC'
          })
        })
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const mockResponse = {
        data: {
          retCode: 0,
          retMsg: 'OK',
          result: { orderId: '12345' }
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      const response = await client.cancelOrder('BTCUSDT', '12345');
      
      expect(response.result.orderId).toBe('12345');
      expect(axiosInstanceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/v5/order/cancel',
          data: {
            category: 'spot',
            symbol: 'BTCUSDT',
            orderId: '12345'
          }
        })
      );
    });
  });

  describe('getPositions', () => {
    it('should return open positions', async () => {
      const mockResponse = {
        data: {
          retCode: 0,
          retMsg: 'OK',
          result: {
            list: [
              {
                symbol: 'BTCUSDT',
                side: 'Buy',
                size: '0.1',
                positionValue: '3000',
                entryPrice: '30000',
                markPrice: '30500',
                unrealisedPnl: '50'
              }
            ]
          }
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      const positions: BybitPosition[] = await client.getPositions();
      
      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('BTCUSDT');
      expect(positions[0].side).toBe('Buy');
      expect(positions[0].unrealizedPnl).toBe('50');
      expect(positions[0].percentage).toBe('1.67'); // (30500/30000 - 1) * 100
    });

    it('should filter positions by symbol', async () => {
      const mockResponse = {
        data: {
          retCode: 0,
          retMsg: 'OK',
          result: { list: [] }
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      await client.getPositions('linear', 'ETHUSDT');
      
      expect(axiosInstanceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          params: {
            category: 'linear',
            symbol: 'ETHUSDT'
          }
        })
      );
    });
  });

  describe('getBalance', () => {
    it('should return account balance', async () => {
      const mockResponse = {
        data: {
          retCode: 0,
          retMsg: 'OK',
          result: {
            list: [
              {
                coin: [
                  {
                    coin: 'BTC',
                    free: '0.1',
                    locked: '0.05',
                    walletBalance: '0.15'
                  },
                  {
                    coin: 'USDT',
                    free: '1000',
                    locked: '200',
                    walletBalance: '1200'
                  }
                ]
              }
            ]
          }
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      const balance = await client.getBalance();
      
      expect(balance).toHaveLength(2);
      expect(balance[0].coin).toBe('BTC');
      expect(balance[0].free).toBe('0.1');
      expect(balance[0].used).toBe('0.05');
      expect(balance[0].total).toBe('0.15');
      expect(balance[1].coin).toBe('USDT');
    });

    it('should handle empty balance response', async () => {
      const mockResponse = {
        data: {
          retCode: 0,
          retMsg: 'OK',
          result: { list: [] }
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      const balance = await client.getBalance();
      
      expect(balance).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should throw BybitApiError for API errors', async () => {
      const mockResponse = {
        data: {
          retCode: 10001,
          retMsg: 'Invalid API key'
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      await expect(client.getMarketData()).rejects.toThrow(BybitApiError);
      await expect(client.getMarketData()).rejects.toThrow('Bybit API Error (10001): Invalid API key');
    });

    it('should throw BybitNetworkError for network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'AxiosError';
      (networkError as any).isAxiosError = true;
      
      // Mock axios.isAxiosError to return true for our mock error
      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);
      
      axiosInstanceMock.mockRejectedValue(networkError);

      await expect(client.getMarketData()).rejects.toThrow(BybitNetworkError);
    });

    it('should throw BybitApiError for HTTP status errors', async () => {
      const httpError = new Error('Request failed with status code 401');
      httpError.name = 'AxiosError';
      (httpError as any).isAxiosError = true;
      (httpError as any).response = {
        status: 401,
        data: { error: 'Unauthorized' }
      };
      
      // Mock axios.isAxiosError to return true for our mock error
      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);
      
      axiosInstanceMock.mockRejectedValue(httpError);

      await expect(client.getMarketData()).rejects.toThrow(BybitApiError);
    });

    it('should handle signature generation errors', () => {
      // Mock crypto.createHmac to throw an error
      const originalCreateHmac = crypto.createHmac;
      jest.spyOn(crypto, 'createHmac').mockImplementation(() => {
        throw new Error('Crypto error');
      });

      expect(() => {
        (client as any).generateSignature({ test: 'param' }, Date.now());
      }).toThrow(BybitSignatureError);

      // Restore original function
      crypto.createHmac = originalCreateHmac;
    });
  });

  describe('backward compatibility', () => {
    it('should maintain getHistoricalCandles method', async () => {
      const mockResponse = {
        data: {
          retCode: 0,
          retMsg: 'OK',
          result: {
            list: [
              [
                '1622505600000',
                '30000',
                '31000',
                '29000',
                '30500',
                '1000'
              ]
            ]
          }
        }
      };

      axiosInstanceMock.mockResolvedValue(mockResponse);

      const candles = await client.getHistoricalCandles('BTCUSDT', 'D');
      
      expect(candles).toHaveLength(1);
      expect(candles[0].open).toBe('30000');
    });
  });
});

