import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { UTCTimestamp } from 'lightweight-charts';
import { Chart, CandlestickData } from '../components/Chart';
import TradingLayout from '../components/Layout/TradingLayout';
import ErrorBoundary from '../components/ErrorBoundary';
import Loading from '../components/Loading';
import apiService, { MarketData } from '../services/api';

// Sample data for demonstration (will be replaced with actual API data)
const generateSampleData = (): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let time = Math.floor(Date.now() / 1000) - (100 * 3600); // 100 hours ago
  let price = 50000; // Starting price
  
  for (let i = 0; i < 100; i++) {
    const changePercent = (Math.random() - 0.5) * 0.04; // +/-2% change
    const change = price * changePercent;
    
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
    
    data.push({
      time: time as UTCTimestamp,
      open,
      high,
      low,
      close,
    });
    
    price = close;
    time += 3600; // 1 hour intervals
  }
  
  return data;
};

export default function HomePage() {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to load real data from API, fallback to sample data
        try {
          const [candlestickData, allMarketData] = await Promise.all([
            apiService.getCandlestickData(selectedSymbol, '1h', 100),
            apiService.getAllMarketData(),
          ]);
          
          setChartData(candlestickData);
          setMarketData(allMarketData);
        } catch (apiError) {
          // Fallback to sample data if API is not available
          console.warn('API not available, using sample data:', apiError);
          setChartData(generateSampleData());
          setMarketData([
            {
              symbol: 'BTC/USD',
              price: 50000,
              change: 1500,
              changePercent: 3.09,
              volume: 2500000,
              high24h: 51200,
              low24h: 48800,
              timestamp: new Date().toISOString(),
            },
            {
              symbol: 'ETH/USD',
              price: 3200,
              change: -85,
              changePercent: -2.58,
              volume: 1800000,
              high24h: 3350,
              low24h: 3150,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedSymbol]);

  if (isLoading) {
    return (
      <TradingLayout>
        <Loading message="Loading dashboard data..." />
      </TradingLayout>
    );
  }

  if (error) {
    return (
      <TradingLayout>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '20px'
        }}>
          <div style={{
            textAlign: 'center',
            backgroundColor: '#1f2937',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #374151'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
            <div style={{ color: '#f87171', fontSize: '16px', marginBottom: '8px' }}>Error Loading Dashboard</div>
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>{error}</div>
          </div>
        </div>
      </TradingLayout>
    );
  }

  return (
    <ErrorBoundary>
      <TradingLayout>
        <Head>
          <title>Dashboard - QuantFlow</title>
          <meta name="description" content="Real-time trading dashboard with charts and market data" />
        </Head>
        
        <div style={{ height: '100%', padding: '4px' }}>
          {/* Main Grid Layout */}
          <div style={{
            height: '100%',
            display: 'grid',
            gridTemplateRows: '1fr 250px',
            gap: '4px'
          }}>
            {/* Top Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 260px',
              gap: '4px'
            }}>
              {/* Main Chart */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '6px',
                border: '1px solid #374151'
              }}>
                {/* Chart Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderBottom: '1px solid #374151'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      margin: 0
                    }}>{selectedSymbol}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {['1m', '5m', '15m', '1h', '4h', '1d'].map((timeframe) => (
                        <button
                          key={timeframe}
                          onClick={() => setSelectedTimeframe(timeframe)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '500',
                            borderRadius: '4px',
                            border: selectedTimeframe === timeframe 
                              ? '1px solid rgba(59, 130, 246, 0.5)' 
                              : '1px solid transparent',
                            backgroundColor: selectedTimeframe === timeframe 
                              ? 'rgba(59, 130, 246, 0.1)' 
                              : 'transparent',
                            color: selectedTimeframe === timeframe 
                              ? '#60a5fa' 
                              : '#9ca3af',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {timeframe}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#10b981',
                      borderRadius: '50%'
                    }}></div>
                    <span style={{ color: '#9ca3af' }}>Live</span>
                  </div>
                </div>
                
                {/* Chart Content */}
                <div style={{
                  padding: '8px',
                  height: 'calc(100% - 41px)'
                }}>
                  <ErrorBoundary fallback={
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#f87171',
                      fontSize: '14px'
                    }}>Chart Error</div>
                  }>
                    <Chart 
                      data={chartData}
                      height={400}
                      symbol={selectedSymbol}
                    />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Market Watch */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '6px',
                border: '1px solid #374151'
              }}>
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #374151'
                }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    margin: 0
                  }}>Market Watch</h3>
                </div>
                <div style={{
                  padding: '4px',
                  height: 'calc(100% - 41px)',
                  overflowY: 'auto'
                }}>
                  {marketData.map((data) => (
                    <div
                      key={data.symbol}
                      onClick={() => setSelectedSymbol(data.symbol)}
                      style={{
                        padding: '8px',
                        borderRadius: '4px',
                        marginBottom: '2px',
                        cursor: 'pointer',
                        backgroundColor: selectedSymbol === data.symbol 
                          ? 'rgba(59, 130, 246, 0.1)' 
                          : 'transparent',
                        border: selectedSymbol === data.symbol 
                          ? '1px solid rgba(59, 130, 246, 0.3)' 
                          : '1px solid transparent',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>{data.symbol}</span>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: data.change >= 0 
                            ? 'rgba(16, 185, 129, 0.2)' 
                            : 'rgba(239, 68, 68, 0.2)',
                          color: data.change >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '500',
                        marginBottom: '2px'
                      }}>
                        ${data.price.toLocaleString()}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: data.change >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '4px'
            }}>
              {/* Order Book Placeholder */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '6px',
                border: '1px solid #374151',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #374151'
                }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    margin: 0
                  }}>Order Book</h3>
                </div>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                    <div>Order Book</div>
                    <div style={{ fontSize: '10px' }}>Connect API</div>
                  </div>
                </div>
              </div>

              {/* Trade History Placeholder */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '6px',
                border: '1px solid #374151',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #374151'
                }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    margin: 0
                  }}>Recent Trades</h3>
                </div>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
                    <div>Trade History</div>
                    <div style={{ fontSize: '10px' }}>Connect API</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '6px',
                border: '1px solid #374151',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #374151'
                }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    margin: 0
                  }}>Quick Actions</h3>
                </div>
                <div style={{
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <button style={{
                    width: '100%',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    Buy {selectedSymbol.split('/')[0]}
                  </button>
                  <button style={{
                    width: '100%',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    Sell {selectedSymbol.split('/')[0]}
                  </button>
                  <button style={{
                    width: '100%',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#3b82f6',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    Portfolio
                  </button>
                  <button style={{
                    width: '100%',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: '#8b5cf6',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    Strategies
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TradingLayout>
    </ErrorBoundary>
  );
}
