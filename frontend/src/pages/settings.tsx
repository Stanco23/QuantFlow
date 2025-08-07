import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import TradingLayout from '../components/Layout/TradingLayout';

interface ExchangeConfig {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
  enabled: boolean;
}

export default function SettingsPage() {
  const [exchanges, setExchanges] = useState<ExchangeConfig[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    apiKey: '',
    apiSecret: '',
    testnet: true,
    enabled: true,
  });

  const supportedExchanges = [
    { id: 'binance', name: 'Binance', icon: '🔶' },
    { id: 'coinbase', name: 'Coinbase Pro', icon: '🔵' },
    { id: 'kraken', name: 'Kraken', icon: '🌊' },
    { id: 'bybit', name: 'Bybit', icon: '🟡' },
    { id: 'okx', name: 'OKX', icon: '⭕' },
  ];

  // Load saved exchanges from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('quantflow_exchanges');
    if (saved) {
      try {
        setExchanges(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved exchanges:', error);
      }
    }
  }, []);

  // Save exchanges to localStorage whenever exchanges change
  useEffect(() => {
    localStorage.setItem('quantflow_exchanges', JSON.stringify(exchanges));
  }, [exchanges]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing exchange
      setExchanges(prev => prev.map(ex => 
        ex.id === editingId 
          ? { ...ex, ...formData }
          : ex
      ));
      setEditingId(null);
    } else {
      // Add new exchange
      const newExchange: ExchangeConfig = {
        id: Date.now().toString(),
        ...formData,
      };
      setExchanges(prev => [...prev, newExchange]);
    }

    // Reset form
    setFormData({
      name: '',
      apiKey: '',
      apiSecret: '',
      testnet: true,
      enabled: true,
    });
    setShowAddForm(false);
  };

  const handleEdit = (exchange: ExchangeConfig) => {
    setFormData({
      name: exchange.name,
      apiKey: exchange.apiKey,
      apiSecret: exchange.apiSecret,
      testnet: exchange.testnet,
      enabled: exchange.enabled,
    });
    setEditingId(exchange.id);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this exchange configuration?')) {
      setExchanges(prev => prev.filter(ex => ex.id !== id));
    }
  };

  const toggleExchange = (id: string) => {
    setExchanges(prev => prev.map(ex =>
      ex.id === id ? { ...ex, enabled: !ex.enabled } : ex
    ));
  };

  const testConnection = async (exchange: ExchangeConfig) => {
    // TODO: Implement actual API connection test
    alert(`Testing connection to ${exchange.name}...`);
  };

  return (
    <TradingLayout>
      <Head>
        <title>Settings - QuantFlow</title>
      </Head>
      
      <div className="h-full p-6 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Exchange API Configuration */}
          <section className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Exchange API Configuration</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Configure your exchange API keys to enable live trading
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingId(null);
                    setFormData({
                      name: '',
                      apiKey: '',
                      apiSecret: '',
                      testnet: true,
                      enabled: true,
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Exchange
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Supported Exchanges Info */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Supported Exchanges</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {supportedExchanges.map((exchange) => (
                    <div
                      key={exchange.id}
                      className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600"
                    >
                      <div className="text-2xl mb-2">{exchange.icon}</div>
                      <div className="text-white text-sm font-medium">{exchange.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add/Edit Form */}
              {showAddForm && (
                <div className="mb-6 bg-slate-700 rounded-lg p-6 border border-slate-600">
                  <h3 className="text-lg font-medium text-white mb-4">
                    {editingId ? 'Edit' : 'Add'} Exchange Configuration
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Exchange Name
                        </label>
                        <select
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Exchange</option>
                          {supportedExchanges.map(ex => (
                            <option key={ex.id} value={ex.name}>{ex.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end space-x-4">
                        <label className="flex items-center text-slate-300">
                          <input
                            type="checkbox"
                            checked={formData.testnet}
                            onChange={(e) => setFormData(prev => ({ ...prev, testnet: e.target.checked }))}
                            className="mr-2 rounded"
                          />
                          Testnet Mode
                        </label>
                        <label className="flex items-center text-slate-300">
                          <input
                            type="checkbox"
                            checked={formData.enabled}
                            onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                            className="mr-2 rounded"
                          />
                          Enabled
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        API Key
                      </label>
                      <input
                        type="text"
                        value={formData.apiKey}
                        onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Enter your API key"
                        className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        API Secret
                      </label>
                      <input
                        type="password"
                        value={formData.apiSecret}
                        onChange={(e) => setFormData(prev => ({ ...prev, apiSecret: e.target.value }))}
                        placeholder="Enter your API secret"
                        className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        {editingId ? 'Update' : 'Add'} Exchange
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingId(null);
                        }}
                        className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Configured Exchanges List */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Configured Exchanges</h3>
                {exchanges.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-slate-400 text-sm mt-2">No exchanges configured yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exchanges.map((exchange) => (
                      <div
                        key={exchange.id}
                        className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                              <div className="text-lg">
                                {supportedExchanges.find(ex => ex.name === exchange.name)?.icon || '🔗'}
                              </div>
                              <div>
                                <h4 className="text-white font-medium">{exchange.name}</h4>
                                <div className="flex items-center space-x-3 text-sm text-slate-400">
                                  <span>API Key: •••••••{exchange.apiKey.slice(-4)}</span>
                                  {exchange.testnet && (
                                    <span className="bg-yellow-800 text-yellow-200 px-2 py-1 rounded text-xs">
                                      TESTNET
                                    </span>
                                  )}
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    exchange.enabled 
                                      ? 'bg-green-800 text-green-200' 
                                      : 'bg-red-800 text-red-200'
                                  }`}>
                                    {exchange.enabled ? 'ENABLED' : 'DISABLED'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => testConnection(exchange)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              Test
                            </button>
                            <button
                              onClick={() => toggleExchange(exchange.id)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                exchange.enabled
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {exchange.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleEdit(exchange)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(exchange.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* General Settings */}
          <section className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">General Settings</h2>
              <p className="text-slate-400 text-sm mt-1">Configure platform preferences</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Default Chart Timeframe
                  </label>
                  <select className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="1m">1 Minute</option>
                    <option value="5m">5 Minutes</option>
                    <option value="15m">15 Minutes</option>
                    <option value="1h" selected>1 Hour</option>
                    <option value="4h">4 Hours</option>
                    <option value="1d">1 Day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Risk Management
                  </label>
                  <select className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="conservative">Conservative</option>
                    <option value="moderate" selected>Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </TradingLayout>
  );
}
