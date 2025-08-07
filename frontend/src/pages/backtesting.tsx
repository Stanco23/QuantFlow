import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { apiService } from '../services/api';

interface BacktestConfig {
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
}

interface BacktestResult {
  id: string;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  trades: Trade[];
  equity: EquityPoint[];
}

interface Trade {
  id: string;
  timestamp: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  pnl: number;
}

interface EquityPoint {
  timestamp: string;
  equity: number;
}

interface Strategy {
  id: number;
  name: string;
  code: string;
}

export default function BacktestingPage() {
  const router = useRouter();
  const { strategy: strategyId } = router.query;
  
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [config, setConfig] = useState<BacktestConfig>({
    symbol: 'BTCUSDT',
    timeframe: '1h',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    initialCapital: 10000
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  
  // Chart reference for TradingView widget
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStrategies();
  }, []);

  useEffect(() => {
    if (strategyId && strategies.length > 0) {
      const strategy = strategies.find(s => s.id === parseInt(strategyId as string));
      if (strategy) {
        setSelectedStrategy(strategy);
      }
    }
  }, [strategyId, strategies]);

  useEffect(() => {
    if (result && chartContainerRef.current) {
      initializeChart();
    }
  }, [result]);

  const loadStrategies = async () => {
    try {
      // Mock strategies data - in real app would call API
      const mockStrategies: Strategy[] = [
        {
          id: 1,
          name: "SMA Crossover",
          code: `// Simple Moving Average Crossover Strategy
if (ta.crossover(ta.sma(close, 10), ta.sma(close, 20))) {
  strategy.entry("Long", strategy.long)
}

if (ta.crossunder(ta.sma(close, 10), ta.sma(close, 20))) {
  strategy.close("Long")
}`
        },
        {
          id: 2,
          name: "RSI Mean Reversion",
          code: `// RSI Mean Reversion Strategy
rsiValue = ta.rsi(close, 14)

if (rsiValue < 30) {
  strategy.entry("Long", strategy.long)
}

if (rsiValue > 70) {
  strategy.close("Long")
}`
        }
      ];
      setStrategies(mockStrategies);
    } catch (err) {
      console.error('Error loading strategies:', err);
    }
  };

  const initializeChart = () => {
    if (!chartContainerRef.current || !result) return;

    // Clear previous chart
    chartContainerRef.current.innerHTML = '';

    // Create equity curve chart using Chart.js or similar
    const canvas = document.createElement('canvas');
    chartContainerRef.current.appendChild(canvas);
    
    // Mock chart implementation - in real app would use actual charting library
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 800;
      canvas.height = 400;
      
      // Draw simple equity curve
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const padding = 40;
      const width = canvas.width - 2 * padding;
      const height = canvas.height - 2 * padding;
      
      result.equity.forEach((point, index) => {
        const x = padding + (index / (result.equity.length - 1)) * width;
        const y = padding + height - ((point.equity - config.initialCapital) / (result.equity[result.equity.length - 1].equity - config.initialCapital)) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Add labels
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.fillText('Equity Curve', padding, 20);
      ctx.fillText(`Initial: $${config.initialCapital}`, padding, canvas.height - 10);
      ctx.fillText(`Final: $${result.equity[result.equity.length - 1]?.equity.toFixed(2)}`, canvas.width - 120, canvas.height - 10);
    }
  };

  const handleRunBacktest = async () => {
    if (!selectedStrategy) {
      setError('Please select a strategy');
      return;
    }

    setIsRunning(true);
    setError(null);
    
    try {
      // Mock backtest execution - in real app would call API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      const mockResult: BacktestResult = {
        id: 'bt_' + Date.now(),
        totalReturn: 15.32,
        sharpeRatio: 1.45,
        maxDrawdown: -8.21,
        winRate: 0.62,
        totalTrades: 48,
        profitFactor: 1.78,
        trades: [
          {
            id: 'trade_1',
            timestamp: '2024-01-02T10:00:00Z',
            type: 'buy',
            price: 42150.50,
            quantity: 0.1,
            pnl: 0
          },
          {
            id: 'trade_2',
            timestamp: '2024-01-05T14:30:00Z',
            type: 'sell',
            price: 43250.75,
            quantity: 0.1,
            pnl: 110.025
          },
          {
            id: 'trade_3',
            timestamp: '2024-01-08T09:15:00Z',
            type: 'buy',
            price: 41800.25,
            quantity: 0.12,
            pnl: 0
          }
        ],
        equity: Array.from({ length: 30 }, (_, i) => ({
          timestamp: new Date(2024, 0, i + 1).toISOString(),
          equity: config.initialCapital + (Math.sin(i / 5) * 500) + (i * 50)
        }))
      };
      
      setResult(mockResult);
    } catch (err) {
      setError('Failed to run backtest');
      console.error('Backtest error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Strategy Backtesting</h1>
              <p className="mt-2 text-gray-600">Test your trading strategies against historical market data.</p>
            </div>
            <button
              onClick={() => router.push('/strategies')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Strategies
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Configuration Panel */}
          <div className="col-span-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Backtest Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Strategy</label>
                  <select
                    value={selectedStrategy?.id || ''}
                    onChange={(e) => {
                      const strategy = strategies.find(s => s.id === parseInt(e.target.value));
                      setSelectedStrategy(strategy || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a strategy</option>
                    {strategies.map(strategy => (
                      <option key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
                  <select
                    value={config.symbol}
                    onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="BTCUSDT">BTC/USDT</option>
                    <option value="ETHUSDT">ETH/USDT</option>
                    <option value="ADAUSDT">ADA/USDT</option>
                    <option value="DOTUSDT">DOT/USDT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
                  <select
                    value={config.timeframe}
                    onChange={(e) => setConfig({ ...config, timeframe: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1m">1 Minute</option>
                    <option value="5m">5 Minutes</option>
                    <option value="15m">15 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="4h">4 Hours</option>
                    <option value="1d">1 Day</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={config.startDate}
                      onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={config.endDate}
                      onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Capital</label>
                  <input
                    type="number"
                    value={config.initialCapital}
                    onChange={(e) => setConfig({ ...config, initialCapital: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="100"
                    step="100"
                  />
                </div>

                <button
                  onClick={handleRunBacktest}
                  disabled={!selectedStrategy || isRunning}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  {isRunning ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running Backtest...
                    </>
                  ) : (
                    'Run Backtest'
                  )}
                </button>
              </div>

              {/* Strategy Preview */}
              {selectedStrategy && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Strategy Preview</h3>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-white p-3 rounded border overflow-auto max-h-40">
                    {selectedStrategy.code}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="col-span-8">
            {result ? (
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatPercentage(result.totalReturn)}
                      </div>
                      <div className="text-sm text-gray-500">Total Return</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.sharpeRatio.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">Sharpe Ratio</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {formatPercentage(result.maxDrawdown)}
                      </div>
                      <div className="text-sm text-gray-500">Max Drawdown</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {formatPercentage(result.winRate * 100)}
                      </div>
                      <div className="text-sm text-gray-500">Win Rate</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">
                        {result.totalTrades}
                      </div>
                      <div className="text-sm text-gray-500">Total Trades</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">
                        {result.profitFactor.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">Profit Factor</div>
                    </div>
                  </div>
                </div>

                {/* Equity Curve Chart */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Equity Curve</h2>
                  <div ref={chartContainerRef} className="w-full h-96 flex items-center justify-center border rounded">
                    {/* Chart will be rendered here */}
                  </div>
                </div>

                {/* Recent Trades */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Trades</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.trades.slice(0, 10).map((trade) => (
                          <tr key={trade.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(trade.timestamp).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                trade.type === 'buy' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {trade.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(trade.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {trade.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(trade.pnl)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No backtest results yet</h3>
                <p className="mt-2 text-gray-600">
                  Configure your backtest parameters and click "Run Backtest" to see performance metrics, equity curves, and trade analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
