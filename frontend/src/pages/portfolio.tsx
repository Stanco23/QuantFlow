import { useState, useEffect } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Loading from '../components/Loading';
import TradingLayout from '../components/Layout/TradingLayout';
import { apiService, PortfolioSummary, Position } from '../services/api';

export default function PortfolioPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock data for portfolio - replace with real API call
      const mockSummary: PortfolioSummary = {
        totalValue: 125000,
        totalPnL: 15750,
        totalPnLPercent: 14.4,
        balance: [
          {
            asset: 'USDT',
            total: 50000,
            available: 45000,
            locked: 5000
          },
          {
            asset: 'BTC',
            total: 2.5,
            available: 2.5,
            locked: 0
          },
          {
            asset: 'ETH', 
            total: 15.0,
            available: 15.0,
            locked: 0
          }
        ],
        positions: [
          {
            id: '1',
            symbol: 'BTC/USD',
            quantity: 2.5,
            averagePrice: 42000,
            currentPrice: 45200,
            pnl: 8000,
            pnlPercent: 7.6
          },
          {
            id: '2',
            symbol: 'ETH/USD',
            quantity: 15.0,
            averagePrice: 2400,
            currentPrice: 2650,
            pnl: 3750,
            pnlPercent: 10.4
          }
        ]
      };
      
      setSummary(mockSummary);
      setPositions(mockSummary.positions);
      
      // For real implementation:
      // const [portfolioSummary, portfolioPositions] = await Promise.all([
      //   apiService.getPortfolio(),
      //   apiService.getPortfolioPositions(),
      // ]);
      // setSummary(portfolioSummary);
      // setPositions(portfolioPositions);
    } catch (err) {
      setError('Failed to load portfolio data');
      console.error('Error loading portfolio data:', err);
    } finally {
      setIsLoading(false);
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
    <TradingLayout>
      <ErrorBoundary>
        {isLoading ? (
          <Loading message="Loading portfolio data..." fullScreen />
        ) : error ? (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0c1015'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>Portfolio Loading Failed</div>
              <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>{error}</div>
            </div>
          </div>
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#0c1015'
          }}>
            {/* Header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #374151',
              backgroundColor: '#111827',
              flexShrink: 0
            }}>
              <h1 style={{ 
                color: 'white', 
                fontSize: '18px', 
                fontWeight: '600',
                margin: 0
              }}>
                Portfolio Dashboard
              </h1>
              <p style={{ 
                color: '#9ca3af',
                fontSize: '13px',
                margin: '4px 0 0 0'
              }}>
                Monitor your assets, positions, and overall performance
              </p>
            </div>

            {/* Scrollable Content */}
            <div style={{ 
              flex: 1, 
              overflow: 'auto', 
              padding: '16px' 
            }}>
              {/* Portfolio Summary */}
              {summary && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#3b82f6', fontSize: '24px', fontWeight: '700' }}>
                      {formatCurrency(summary.totalValue)}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                      Total Portfolio Value
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      color: summary.totalPnL >= 0 ? '#10b981' : '#ef4444', 
                      fontSize: '24px', 
                      fontWeight: '700' 
                    }}>
                      {formatCurrency(summary.totalPnL)}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                      Total P&L
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      color: summary.totalPnLPercent >= 0 ? '#10b981' : '#ef4444', 
                      fontSize: '24px', 
                      fontWeight: '700' 
                    }}>
                      {formatPercentage(summary.totalPnLPercent)}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                      Total Return
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#8b5cf6', fontSize: '24px', fontWeight: '700' }}>
                      {summary.positions.length}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                      Open Positions
                    </div>
                  </div>
                </div>
              )}

              {/* Open Positions */}
              <div style={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '24px'
              }}>
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid #374151'
                }}>
                  <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                    Open Positions
                  </h2>
                </div>
                
                <div style={{ overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#111827' }}>
                      <tr>
                        <th style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          color: '#6b7280',
                          fontSize: '11px',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Symbol</th>
                        <th style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          color: '#6b7280',
                          fontSize: '11px',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Quantity</th>
                        <th style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          color: '#6b7280',
                          fontSize: '11px',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Entry Price</th>
                        <th style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          color: '#6b7280',
                          fontSize: '11px',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Current Price</th>
                        <th style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          color: '#6b7280',
                          fontSize: '11px',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>P&L</th>
                        <th style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          color: '#6b7280',
                          fontSize: '11px',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>P&L %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.length > 0 ? (
                        positions.map((pos) => (
                          <tr key={pos.id} style={{ borderBottom: '1px solid #374151' }}>
                            <td style={{
                              padding: '12px 16px',
                              color: 'white',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>{pos.symbol}</td>
                            <td style={{
                              padding: '12px 16px',
                              color: '#d1d5db',
                              fontSize: '13px'
                            }}>{pos.quantity}</td>
                            <td style={{
                              padding: '12px 16px',
                              color: '#d1d5db',
                              fontSize: '13px'
                            }}>{formatCurrency(pos.averagePrice)}</td>
                            <td style={{
                              padding: '12px 16px',
                              color: '#d1d5db',
                              fontSize: '13px'
                            }}>{formatCurrency(pos.currentPrice)}</td>
                            <td style={{
                              padding: '12px 16px',
                              color: pos.pnl >= 0 ? '#10b981' : '#ef4444',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>
                              {formatCurrency(pos.pnl)}
                            </td>
                            <td style={{
                              padding: '12px 16px',
                              color: pos.pnlPercent >= 0 ? '#10b981' : '#ef4444',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>
                              {formatPercentage(pos.pnlPercent)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{
                            padding: '24px',
                            textAlign: 'center',
                            color: '#6b7280',
                            fontSize: '13px'
                          }}>
                            No open positions
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Asset Allocation */}
              <div style={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
                  Asset Allocation
                </h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  alignItems: 'center'
                }}>
                  {/* Mock Chart */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '160px', height: '160px', position: 'relative' }}>
                      <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 36 36">
                        <path 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          fill="none" 
                          stroke="#374151" 
                          strokeWidth="2.8" 
                        />
                        <path 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" 
                          fill="none" 
                          stroke="#10B981" 
                          strokeWidth="2.8" 
                          strokeDasharray="60, 100" 
                        />
                        <path 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" 
                          fill="none" 
                          stroke="#3B82F6" 
                          strokeWidth="2.8" 
                          strokeDasharray="30, 100" 
                          strokeDashoffset="-60" 
                        />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%'
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>Bitcoin (BTC)</div>
                        <div style={{ color: '#6b7280', fontSize: '11px' }}>60% • 2.5 BTC</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#3b82f6',
                        borderRadius: '50%'
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>Ethereum (ETH)</div>
                        <div style={{ color: '#6b7280', fontSize: '11px' }}>30% • 15.0 ETH</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#6b7280',
                        borderRadius: '50%'
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>Cash (USD)</div>
                        <div style={{ color: '#6b7280', fontSize: '11px' }}>10% • {formatCurrency(12500)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ErrorBoundary>
    </TradingLayout>
  );
}
