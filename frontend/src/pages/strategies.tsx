import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StrategyEditor from '../components/StrategyEditor';
import ErrorBoundary from '../components/ErrorBoundary';
import Loading from '../components/Loading';
import TradingLayout from '../components/Layout/TradingLayout';
import { apiService, Strategy } from '../services/api';

interface ValidationResponse {
  ast: any;
  errors: string[];
}

export default function StrategiesPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [strategyName, setStrategyName] = useState('');
  const [strategyCode, setStrategyCode] = useState('// Example Pine Script-style strategy\n// Define your entry and exit conditions\n\nif (ta.crossover(ta.sma(close, 10), ta.sma(close, 20))) {\n  // Buy signal when fast SMA crosses over slow SMA\n  strategy.entry("Long", strategy.long)\n}\n\nif (ta.crossunder(ta.sma(close, 10), ta.sma(close, 20))) {\n  // Sell signal when fast SMA crosses under slow SMA\n  strategy.close("Long")\n}');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load strategies on component mount
  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      setIsLoading(true);
      const strategies = await apiService.getStrategies();
      setStrategies(strategies);
    } catch (err) {
      setError('Failed to load strategies');
      console.error('Error loading strategies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStrategySelect = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setStrategyCode(strategy.code);
    setStrategyName(strategy.name);
    setIsCreatingNew(false);
  };

  const handleNewStrategy = () => {
    setSelectedStrategy(null);
    setStrategyName('New Strategy');
    setStrategyCode('// Enter your strategy code here\n');
    setIsCreatingNew(true);
  };

  const handleSaveStrategy = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate strategy first
      const validation = await validateStrategy(strategyCode);
      if (validation.errors.length > 0) {
        setError('Strategy has validation errors. Please fix them before saving.');
        return;
      }

      let savedStrategy: Strategy;

      if (isCreatingNew) {
        // Create new strategy
        savedStrategy = await apiService.createStrategy({
          name: strategyName,
          code: strategyCode
        });
        setStrategies([...strategies, savedStrategy]);
        setSelectedStrategy(savedStrategy);
        setIsCreatingNew(false);
      } else if (selectedStrategy) {
        // Update existing strategy
        savedStrategy = await apiService.updateStrategy(selectedStrategy.id, {
          name: strategyName,
          code: strategyCode
        });
        const updatedStrategies = strategies.map(s => 
          s.id === selectedStrategy.id ? savedStrategy : s
        );
        setStrategies(updatedStrategies);
        setSelectedStrategy(savedStrategy);
      }
    } catch (err) {
      setError('Failed to save strategy');
      console.error('Error saving strategy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateStrategy = async (code: string): Promise<ValidationResponse> => {
    try {
      const response = await apiService.validateStrategy(code);
      return response;
    } catch (error) {
      console.error('Error validating strategy:', error);
      return { ast: null, errors: ['Failed to validate strategy'] };
    }
  };

  const handleRunBacktest = () => {
    if (!selectedStrategy) return;
    router.push(`/backtesting?strategy=${selectedStrategy.id}`);
  };

  const handleDeleteStrategy = async () => {
    if (!selectedStrategy || !confirm('Are you sure you want to delete this strategy?')) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Delete strategy via API
      await apiService.deleteStrategy(selectedStrategy.id);
      
      const updatedStrategies = strategies.filter(s => s.id !== selectedStrategy.id);
      setStrategies(updatedStrategies);
      
      // Select first strategy or reset
      if (updatedStrategies.length > 0) {
        handleStrategySelect(updatedStrategies[0]);
      } else {
        setSelectedStrategy(null);
        setStrategyCode('');
        setStrategyName('');
      }
    } catch (err) {
      setError('Failed to delete strategy');
      console.error('Error deleting strategy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TradingLayout>
      <ErrorBoundary>
        {isLoading && strategies.length === 0 ? (
          <Loading message="Loading strategies..." fullScreen />
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
                Strategy Development
              </h1>
              <p style={{ 
                color: '#9ca3af',
                fontSize: '13px',
                margin: '4px 0 0 0'
              }}>
                Create and manage your trading strategies with Pine Script syntax
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div style={{
                margin: '12px',
                padding: '10px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg style={{ width: '16px', height: '16px', color: '#ef4444' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: '500' }}>
                  {error}
                </span>
              </div>
            )}

            {/* Main Content */}
            <div style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '280px 1fr',
              gap: '1px',
              backgroundColor: '#374151',
              overflow: 'hidden'
            }}>
              {/* Strategy List */}
              <div style={{
                backgroundColor: '#1f2937',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '12px',
                  borderBottom: '1px solid #374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                    Strategies
                  </h3>
                  <button
                    onClick={handleNewStrategy}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New
                  </button>
                </div>

                <div style={{ flex: 1, overflow: 'auto' }}>
                  {strategies.length === 0 ? (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '13px'
                    }}>
                      No strategies found
                    </div>
                  ) : (
                    strategies.map((strategy) => (
                      <div
                        key={strategy.id}
                        onClick={() => handleStrategySelect(strategy)}
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid #374151',
                          cursor: 'pointer',
                          backgroundColor: selectedStrategy?.id === strategy.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          borderLeft: selectedStrategy?.id === strategy.id ? '2px solid #3b82f6' : '2px solid transparent'
                        }}
                      >
                        <h4 style={{
                          color: selectedStrategy?.id === strategy.id ? '#60a5fa' : '#d1d5db',
                          fontSize: '13px',
                          fontWeight: '500',
                          margin: '0 0 4px 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {strategy.name}
                        </h4>
                        <p style={{
                          color: '#6b7280',
                          fontSize: '11px',
                          margin: 0
                        }}>
                          Updated {new Date(strategy.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Main Editor Area */}
              <div style={{
                backgroundColor: '#1f2937',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {/* Editor Header */}
                <div style={{
                  padding: '12px',
                  borderBottom: '1px solid #374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <input
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="Strategy name"
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      outline: 'none',
                      padding: '4px 0'
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedStrategy && !isCreatingNew && (
                      <button
                        onClick={handleDeleteStrategy}
                        disabled={isLoading}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: isLoading ? 0.5 : 1
                        }}
                      >
                        <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}

                    <button
                      onClick={handleRunBacktest}
                      disabled={!selectedStrategy || isLoading}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#10b981',
                        border: '1px solid #10b981',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: (!selectedStrategy || isLoading) ? 0.5 : 1
                      }}
                    >
                      <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Backtest
                    </button>

                    <button
                      onClick={handleSaveStrategy}
                      disabled={isLoading || !strategyName.trim() || !strategyCode.trim()}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: (isLoading || !strategyName.trim() || !strategyCode.trim()) ? 0.5 : 1
                      }}
                    >
                      {isLoading ? (
                        <>
                          <svg style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Strategy Editor */}
                <div style={{ 
                  flex: 1, 
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    flex: 1,
                    padding: '12px',
                    overflow: 'hidden'
                  }}>
                    <StrategyEditor
                      value={strategyCode}
                      onChange={setStrategyCode}
                      height="100%"
                    />
                  </div>

                  {/* Strategy Info */}
                  {selectedStrategy && (
                    <div style={{
                      padding: '12px',
                      borderTop: '1px solid #374151',
                      backgroundColor: '#111827'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        fontSize: '12px'
                      }}>
                        <div>
                          <span style={{ color: '#6b7280', fontWeight: '500' }}>Created: </span>
                          <span style={{ color: '#d1d5db' }}>
                            {new Date(selectedStrategy.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280', fontWeight: '500' }}>Modified: </span>
                          <span style={{ color: '#d1d5db' }}>
                            {new Date(selectedStrategy.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </ErrorBoundary>
    </TradingLayout>
  );
}
