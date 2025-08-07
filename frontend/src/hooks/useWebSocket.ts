import { useState, useEffect, useRef } from 'react';
import apiService from '../services/api';

export interface TickerData {
  type: 'ticker';
  symbol: string;
  price: number;
  change: number;
  volume: number;
  high: number;
  low: number;
  bid: number;
  ask: number;
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'welcome' | 'subscribed' | 'unsubscribed' | 'ticker' | 'error' | 'pong';
  symbol?: string;
  message?: string;
  [key: string]: any;
}

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [tickerData, setTickerData] = useState<Record<string, TickerData>>({});
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = () => {
    try {
      console.log('Connecting to WebSocket...');
      const ws = apiService.createWebSocketConnection();
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Resubscribe to all symbols
        subscribedSymbolsRef.current.forEach(symbol => {
          apiService.subscribeToSymbol(ws, symbol);
        });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          setError('Maximum reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to connect to WebSocket server');
    }
  };

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'welcome':
        console.log('WebSocket welcome message:', message.message);
        break;
        
      case 'subscribed':
        console.log(`Subscribed to ${message.symbol}`);
        break;
        
      case 'unsubscribed':
        console.log(`Unsubscribed from ${message.symbol}`);
        break;
        
      case 'ticker':
        if (message.symbol) {
          setTickerData(prev => ({
            ...prev,
            [message.symbol as string]: message as TickerData
          }));
        }
        break;
        
      case 'error':
        console.error('WebSocket error message:', message.message);
        setError(message.message || 'Unknown WebSocket error');
        break;
        
      case 'pong':
        // Handle pong response
        break;
        
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  };

  const subscribe = (symbol: string) => {
    const normalizedSymbol = symbol.replace('/', '').replace('USD', 'USDT');
    subscribedSymbolsRef.current.add(symbol);
    
    if (wsRef.current && isConnected) {
      apiService.subscribeToSymbol(wsRef.current, symbol);
    }
  };

  const unsubscribe = (symbol: string) => {
    subscribedSymbolsRef.current.delete(symbol);
    
    if (wsRef.current && isConnected) {
      apiService.unsubscribeFromSymbol(wsRef.current, symbol);
    }

    // Remove ticker data for unsubscribed symbol
    setTickerData(prev => {
      const updated = { ...prev };
      const normalizedSymbol = symbol.replace('/', '').replace('USD', 'USDT');
      delete updated[normalizedSymbol];
      return updated;
    });
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    subscribedSymbolsRef.current.clear();
    setTickerData({});
  };

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  // Ping to keep connection alive
  useEffect(() => {
    if (isConnected && wsRef.current) {
      const pingInterval = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Ping every 30 seconds

      return () => clearInterval(pingInterval);
    }
  }, [isConnected]);

  return {
    isConnected,
    tickerData,
    error,
    subscribe,
    unsubscribe,
    disconnect,
    reconnect: connect
  };
};

export default useWebSocket;
