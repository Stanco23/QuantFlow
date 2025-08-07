import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { UTCTimestamp } from 'lightweight-charts';
import { Chart, CandlestickData } from '../components/Chart';
import TradingLayout from '../components/Layout/TradingLayout';
import apiService, { CreateOrderRequest, Order } from '../services/api';
import { useWebSocket, TickerData } from '../hooks/useWebSocket';

export default function TradingPage() {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1h');
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderForm, setOrderForm] = useState<CreateOrderRequest>({
    symbol: 'BTC/USD',
    side: 'buy',
    quantity: 0,
    price: 0,
    type: 'limit',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [chartError, setChartError] = useState<string | null>(null);
  
  // WebSocket for real-time data
  const { isConnected, tickerData, error: wsError, subscribe, unsubscribe } = useWebSocket();
  const [currentTicker, setCurrentTicker] = useState<TickerData | null>(null);

  const loadChartData = useCallback(async () => {
    try {
      setIsLoading(true);
      setChartError(null);
      console.log('Loading chart data for:', selectedSymbol, selectedTimeframe);
      const data = await apiService.getCandlestickData(selectedSymbol, selectedTimeframe, 100);
      console.log('Received chart data:', data.length, 'candles');
      setChartData(data);
    } catch (error) {
      console.error('Failed to load chart data:', error);
      setChartData([]);
      setChartError(error instanceof Error ? error.message : 'Failed to load chart data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSymbol, selectedTimeframe]);

  const loadOrders = useCallback(async () => {
    try {
      const ordersData = await apiService.getOrders();
      setOrders(ordersData);
    } catch (error) {
      console.warn('Could not load orders:', error);
    }
  }, []);

  // Initial data load and reload when symbol/timeframe changes
  useEffect(() => {
    const loadSymbols = async () => {
      try {
        const symbolsData = await apiService.getSymbols();
        setSymbols(symbolsData);
      } catch (error) {
        console.warn('Could not load symbols, using fallback:', error);
        // Fallback to hardcoded symbols if API fails
        setSymbols(['BTC/USD', 'ETH/USD', 'ADA/USD', 'DOT/USD']);
      }
    };
    
    // Only load symbols on initial mount (when symbols array is empty)
    if (symbols.length === 0) {
      loadSymbols();
    }
    
    // Load chart data whenever symbol or timeframe changes
    loadChartData();
    loadOrders();
  }, [selectedSymbol, selectedTimeframe, loadChartData, loadOrders, symbols.length]);

  // Subscribe to WebSocket ticker data when symbol changes
  useEffect(() => {
    if (isConnected) {
      subscribe(selectedSymbol);
      
      return () => {
        unsubscribe(selectedSymbol);
      };
    }
  }, [selectedSymbol, isConnected, subscribe, unsubscribe]);

  // Update current ticker data when WebSocket data changes
  useEffect(() => {
    const normalizedSymbol = selectedSymbol.replace('/', '').replace('USD', 'USDT');
    if (tickerData[normalizedSymbol]) {
      setCurrentTicker(tickerData[normalizedSymbol]);
    }
  }, [tickerData, selectedSymbol]);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const newOrder = await apiService.createOrder(orderForm);
      setOrders(prev => [newOrder, ...prev]);
      
      // Reset form
      setOrderForm({
        symbol: selectedSymbol,
        side: 'buy',
        quantity: 0,
        price: 0,
        type: 'limit',
      });
      
      alert(`Order placed successfully! Order ID: ${newOrder.id}`);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await apiService.cancelOrder(orderId);
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      ));
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  return (
    <TradingLayout>
      <Head>
        <title>Trading - QuantFlow</title>
        <meta name="description" content="Advanced trading interface with real-time charts" />
      </Head>
      
      <div className="h-full bg-gray-950">
        <div className="h-full grid grid-cols-[1fr_280px] gap-0.5 p-1">
          {/* Chart Section */}
          <div className="bg-gray-900/95 rounded-md border border-gray-800/50">
            {/* Real-time Price Header */}
            {currentTicker && (
              <div className="px-3 py-2 border-b border-gray-800/50 bg-gray-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-bold text-white">{selectedSymbol}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-mono text-white">
                        ${currentTicker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className={`text-sm font-medium ${
                        currentTicker.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {currentTicker.change >= 0 ? '+' : ''}{(currentTicker.change * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <div>H: ${currentTicker.high.toLocaleString()}</div>
                    <div>L: ${currentTicker.low.toLocaleString()}</div>
                    <div>Vol: {(currentTicker.volume / 1000000).toFixed(1)}M</div>
                    <div className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-400' : 'bg-red-400'
                    }`}></div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/50">
              <div className="flex items-center space-x-3">
                <select 
                  className="bg-gray-800/50 border border-gray-700/50 text-white px-2 py-1 rounded text-sm focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                  value={selectedSymbol}
                  onChange={(e) => {
                    setSelectedSymbol(e.target.value);
                    setOrderForm(prev => ({ ...prev, symbol: e.target.value }));
                  }}
                >
                  {symbols.map(symbol => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </select>
                
                {/* Timeframe Selector */}
                <div className="flex items-center space-x-1">
                  {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        selectedTimeframe === tf 
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border border-gray-700/30'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-1.5 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-emerald-400' : 'bg-red-400'
                }`}></div>
                <span className="text-gray-400">
                  {isConnected ? 'Live Trading' : 'Offline'}
                </span>
                {wsError && (
                  <span className="text-red-400 text-xs">({wsError})</span>
                )}
              </div>
            </div>
            
            <div className="p-2" style={{ height: 'calc(100% - 41px)' }}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="loading-spinner"></div>
                  <span className="ml-2 text-gray-400 text-sm">Loading...</span>
                </div>
              ) : chartError ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg className="mx-auto h-12 w-12 mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-white mb-2">Chart Data Unavailable</h3>
                  <p className="text-sm text-gray-400 mb-4 max-w-sm">{chartError}</p>
                  <button
                    onClick={() => loadChartData()}
                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded text-sm font-medium transition-colors"
                  >
                    Retry Loading Chart
                  </button>
                </div>
              ) : (
                <Chart 
                  data={chartData}
                  height={500}
                  symbol={selectedSymbol}
                />
              )}
            </div>
          </div>

          {/* Trading Panel */}
          <div className="flex flex-col gap-0.5">
            {/* Order Form */}
            <div className="bg-gray-900/95 rounded-md border border-gray-800/50 flex-1">
              <div className="px-3 py-2 border-b border-gray-800/50">
                <h3 className="text-sm font-medium text-white">Place Order</h3>
              </div>
              
              <div className="p-2">
                <form onSubmit={handleOrderSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Side</label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                          orderForm.side === 'buy' 
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                        }`}
                        onClick={() => setOrderForm(prev => ({ ...prev, side: 'buy' }))}
                      >
                        Buy
                      </button>
                      <button
                        type="button"
                        className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                          orderForm.side === 'sell' 
                            ? 'bg-red-600/20 text-red-300 border border-red-500/30' 
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                        }`}
                        onClick={() => setOrderForm(prev => ({ ...prev, side: 'sell' }))}
                      >
                        Sell
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Order Type</label>
                    <select
                      className="w-full bg-gray-800/50 border border-gray-700/50 text-white px-2 py-1.5 rounded text-xs focus:ring-1 focus:ring-blue-500/50"
                      value={orderForm.type}
                      onChange={(e) => setOrderForm(prev => ({ 
                        ...prev, 
                        type: e.target.value as 'market' | 'limit' | 'stop' 
                      }))}
                    >
                      <option value="limit">Limit</option>
                      <option value="market">Market</option>
                      <option value="stop">Stop</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      step="0.00001"
                      min="0"
                      className="w-full bg-gray-800/50 border border-gray-700/50 text-white px-2 py-1.5 rounded text-xs focus:ring-1 focus:ring-blue-500/50"
                      value={orderForm.quantity}
                      onChange={(e) => setOrderForm(prev => ({ 
                        ...prev, 
                        quantity: parseFloat(e.target.value) || 0 
                      }))}
                      required
                    />
                  </div>

                  {orderForm.type !== 'market' && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full bg-gray-800/50 border border-gray-700/50 text-white px-2 py-1.5 rounded text-xs focus:ring-1 focus:ring-blue-500/50"
                        value={orderForm.price}
                        onChange={(e) => setOrderForm(prev => ({ 
                          ...prev, 
                          price: parseFloat(e.target.value) || 0 
                        }))}
                        required={orderForm.type === 'limit' || orderForm.type === 'stop'}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                      orderForm.side === 'buy'
                        ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {isLoading ? 'Placing...' : `${orderForm.side.toUpperCase()} ${selectedSymbol.split('/')[0]}`}
                  </button>
                </form>
              </div>
            </div>

            {/* Open Orders */}
            <div className="bg-gray-900/95 rounded-md border border-gray-800/50 flex-1">
              <div className="px-3 py-2 border-b border-gray-800/50">
                <h3 className="text-sm font-medium text-white">Open Orders</h3>
              </div>
              
              <div className="p-2 h-full">
                {orders.length === 0 ? (
                  <div className="text-center text-gray-500 py-16">
                    <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-xs">No open orders</p>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto custom-scrollbar h-full">
                    {orders.slice(0, 10).map((order) => (
                      <div 
                        key={order.id}
                        className="bg-gray-800/50 p-2 rounded border border-gray-700/50"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-medium text-xs ${
                            order.side === 'buy' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {order.side.toUpperCase()} {order.symbol}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            order.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                            order.status === 'filled' ? 'bg-emerald-900/50 text-emerald-300' :
                            order.status === 'cancelled' ? 'bg-red-900/50 text-red-300' :
                            'bg-gray-700/50 text-gray-300'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-gray-400 text-xs">
                          Qty: {order.quantity} | {order.type}
                          {order.price && ` | $${order.price.toLocaleString()}`}
                        </div>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="mt-1 text-red-400 hover:text-red-300 text-xs"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TradingLayout>
  );
}
