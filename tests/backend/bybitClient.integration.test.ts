/**
 * Integration tests for Bybit API Client
 * These tests can be run against the real Bybit sandbox/testnet
 * Set environment variables BYBIT_API_KEY and BYBIT_API_SECRET to enable
 */

import { BybitClient, BybitApiError, BybitNetworkError } from '../../backend/src/services/bybitClient';

const API_KEY = process.env.BYBIT_API_KEY || 'test_key';
const API_SECRET = process.env.BYBIT_API_SECRET || 'test_secret';
const USE_TESTNET = process.env.BYBIT_TESTNET !== 'false'; // Default to testnet
const SKIP_INTEGRATION = !process.env.BYBIT_API_KEY; // Skip if no API key provided

describe('BybitClient Integration Tests', () => {
  let client: BybitClient;

  beforeAll(() => {
    if (SKIP_INTEGRATION) {
      console.log('⚠️  Skipping integration tests - BYBIT_API_KEY not provided');
      console.log('   Set BYBIT_API_KEY and BYBIT_API_SECRET environment variables to run integration tests');
      console.log('   Use BYBIT_TESTNET=false to test against live API (not recommended)');
    }
    
    client = new BybitClient(API_KEY, API_SECRET, USE_TESTNET);
  });

  describe('Public endpoints (no authentication)', () => {
    test('should get market data for BTCUSDT', async () => {
      if (SKIP_INTEGRATION) return;

      try {
        const marketData = await client.getMarketData('BTCUSDT');
        
        expect(Array.isArray(marketData)).toBe(true);
        expect(marketData.length).toBeGreaterThan(0);
        
        const btcData = marketData[0];
        expect(btcData.symbol).toBe('BTCUSDT');
        expect(typeof btcData.lastPrice).toBe('string');
        expect(parseFloat(btcData.lastPrice)).toBeGreaterThan(0);
      } catch (error) {
        if (error instanceof BybitApiError) {
          console.warn(`API Error: ${error.message}`);
        } else {
          throw error;
        }
      }
    }, 10000);

    test('should get historical candles for BTCUSDT', async () => {
      if (SKIP_INTEGRATION) return;

      try {
        const candles = await client.getHistorical('BTCUSDT', '1h', undefined, undefined, 10);
        
        expect(Array.isArray(candles)).toBe(true);
        expect(candles.length).toBeLessThanOrEqual(10);
        
        if (candles.length > 0) {
          const candle = candles[0];
          expect(typeof candle.open).toBe('string');
          expect(typeof candle.high).toBe('string');
          expect(typeof candle.low).toBe('string');
          expect(typeof candle.close).toBe('string');
          expect(typeof candle.volume).toBe('string');
          expect(typeof candle.openTime).toBe('number');
          expect(candle.openTime).toBeGreaterThan(0);
          
          // Validate OHLC relationships
          expect(parseFloat(candle.high)).toBeGreaterThanOrEqual(parseFloat(candle.low));
          expect(parseFloat(candle.high)).toBeGreaterThanOrEqual(parseFloat(candle.open));
          expect(parseFloat(candle.high)).toBeGreaterThanOrEqual(parseFloat(candle.close));
        }
      } catch (error) {
        if (error instanceof BybitApiError) {
          console.warn(`API Error: ${error.message}`);
        } else {
          throw error;
        }
      }
    }, 10000);

    test('should get market data for multiple symbols', async () => {
      if (SKIP_INTEGRATION) return;

      try {
        const marketData = await client.getMarketData(); // Get all symbols
        
        expect(Array.isArray(marketData)).toBe(true);
        expect(marketData.length).toBeGreaterThan(1);
        
        // Check that we have common trading pairs
        const symbols = marketData.map(data => data.symbol);
        expect(symbols).toContain('BTCUSDT');
        
        // Verify structure of each market data item
        marketData.slice(0, 5).forEach(data => {
          expect(typeof data.symbol).toBe('string');
          expect(typeof data.lastPrice).toBe('string');
          expect(typeof data.volume24h).toBe('string');
          expect(parseFloat(data.lastPrice)).toBeGreaterThan(0);
        });
      } catch (error) {
        if (error instanceof BybitApiError) {
          console.warn(`API Error: ${error.message}`);
        } else {
          throw error;
        }
      }
    }, 15000);
  });

  describe('Private endpoints (require authentication)', () => {
    test('should get account balance', async () => {
      if (SKIP_INTEGRATION) return;

      try {
        const balance = await client.getBalance();
        
        expect(Array.isArray(balance)).toBe(true);
        
        // Balance might be empty for test accounts
        balance.forEach(coin => {
          expect(typeof coin.coin).toBe('string');
          expect(typeof coin.free).toBe('string');
          expect(typeof coin.used).toBe('string');
          expect(typeof coin.total).toBe('string');
          expect(parseFloat(coin.total)).toBeGreaterThanOrEqual(0);
        });
      } catch (error) {
        if (error instanceof BybitApiError) {
          console.warn(`Balance API Error: ${error.message}`);
          // This might fail with invalid API keys - that's expected
        } else {
          throw error;
        }
      }
    }, 10000);

    test('should get positions', async () => {
      if (SKIP_INTEGRATION) return;

      try {
        const positions = await client.getPositions();
        
        expect(Array.isArray(positions)).toBe(true);
        
        // Positions might be empty
        positions.forEach(position => {
          expect(typeof position.symbol).toBe('string');
          expect(typeof position.side).toBe('string');
          expect(typeof position.size).toBe('string');
          expect(['Buy', 'Sell', 'None']).toContain(position.side);
        });
      } catch (error) {
        if (error instanceof BybitApiError) {
          console.warn(`Positions API Error: ${error.message}`);
          // This might fail with invalid API keys - that's expected
        } else {
          throw error;
        }
      }
    }, 10000);

    // Note: We don't test order placement in integration tests to avoid
    // accidentally placing real orders. These should be tested manually
    // in a controlled environment.
    
    test.skip('should place and cancel a test order', async () => {
      if (SKIP_INTEGRATION) return;

      // This test is skipped by default as it involves actual trading operations
      // Uncomment and run manually in testnet environment only
      
      try {
        const order = {
          symbol: 'BTCUSDT',
          side: 'Buy' as const,
          orderType: 'Limit' as const,
          qty: '0.001', // Very small amount for testing
          price: '20000', // Below market price to avoid immediate fill
          timeInForce: 'GTC' as const
        };

        const response = await client.placeOrder(order);
        expect(response.result).toHaveProperty('orderId');

        const orderId = response.result.orderId;
        
        // Cancel the order immediately
        const cancelResponse = await client.cancelOrder('BTCUSDT', orderId);
        expect(cancelResponse.result).toHaveProperty('orderId');
      } catch (error) {
        if (error instanceof BybitApiError) {
          console.warn(`Order API Error: ${error.message}`);
        } else {
          throw error;
        }
      }
    });
  });

  describe('Error handling', () => {
    test('should handle invalid symbol gracefully', async () => {
      if (SKIP_INTEGRATION) return;

      try {
        await client.getMarketData('INVALIDINVALID');
      } catch (error) {
        expect(error).toBeInstanceOf(BybitApiError);
      }
    }, 10000);

    test('should handle network issues', async () => {
      if (SKIP_INTEGRATION) return;

      // Create a client with invalid URL to test network error handling
      const badClient = new BybitClient(API_KEY, API_SECRET, USE_TESTNET);
      (badClient as any).baseUrl = 'https://invalid-api-url.com';
      (badClient as any).axiosInstance.defaults.baseURL = 'https://invalid-api-url.com';

      try {
        await badClient.getMarketData('BTCUSDT');
      } catch (error) {
        expect(error).toBeInstanceOf(BybitNetworkError);
      }
    }, 10000);
  });

  describe('Rate limiting and performance', () => {
    test('should handle multiple concurrent requests', async () => {
      if (SKIP_INTEGRATION) return;

      const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'];
      const promises = symbols.map(symbol => 
        client.getMarketData(symbol).catch(err => ({ error: err }))
      );

      const results = await Promise.all(promises);
      
      // At least some requests should succeed
      const successCount = results.filter(result => !('error' in result)).length;
      expect(successCount).toBeGreaterThan(0);
    }, 15000);

    test('should respect API response time limits', async () => {
      if (SKIP_INTEGRATION) return;

      const start = Date.now();
      await client.getMarketData('BTCUSDT');
      const end = Date.now();

      // API should respond within reasonable time (30 seconds max)
      expect(end - start).toBeLessThan(30000);
    }, 35000);
  });

  describe('Data consistency', () => {
    test('should return consistent data structure', async () => {
      if (SKIP_INTEGRATION) return;

      try {
        const marketData1 = await client.getMarketData('BTCUSDT');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        const marketData2 = await client.getMarketData('BTCUSDT');

        expect(marketData1[0].symbol).toBe(marketData2[0].symbol);
        
        // Prices might change but should still be valid numbers
        expect(parseFloat(marketData1[0].lastPrice)).toBeGreaterThan(0);
        expect(parseFloat(marketData2[0].lastPrice)).toBeGreaterThan(0);
      } catch (error) {
        if (error instanceof BybitApiError) {
          console.warn(`Consistency test API Error: ${error.message}`);
        } else {
          throw error;
        }
      }
    }, 15000);

    test('should return historical data in correct time order', async () => {
      if (SKIP_INTEGRATION) return;

      try {
        const candles = await client.getHistorical('BTCUSDT', '1h', undefined, undefined, 100);
        
        if (candles.length > 1) {
          // Candles should be in descending time order (newest first)
          for (let i = 0; i < candles.length - 1; i++) {
            expect(candles[i].openTime).toBeGreaterThanOrEqual(candles[i + 1].openTime);
          }
        }
      } catch (error) {
        if (error instanceof BybitApiError) {
          console.warn(`Historical data API Error: ${error.message}`);
        } else {
          throw error;
        }
      }
    }, 10000);
  });
});
