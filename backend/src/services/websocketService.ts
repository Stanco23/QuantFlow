import WebSocket from 'ws';
import { Server } from 'http';
import { BybitClient } from './bybitClient';

interface MarketDataSubscription {
  symbol: string;
  clients: Set<WebSocket>;
}

export class WebSocketService {
  private wss: WebSocket.Server;
  private bybitWs: WebSocket | null = null;
  private subscriptions: Map<string, MarketDataSubscription> = new Map();
  private bybitClient: BybitClient;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  constructor(server: Server, bybitClient: BybitClient) {
    this.bybitClient = bybitClient;
    this.wss = new WebSocket.Server({ 
      server, 
      path: '/ws' 
    });
    
    this.setupClientHandlers();
    this.connectToBybit();
  }

  private setupClientHandlers() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('Client connected to WebSocket');
      
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Invalid JSON message from client:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid JSON format' 
          }));
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        this.removeClientFromAllSubscriptions(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to QuantFlow market data stream'
      }));
    });
  }

  private handleClientMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'subscribe':
        if (data.symbol) {
          this.subscribeToSymbol(ws, data.symbol);
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Symbol required for subscription'
          }));
        }
        break;

      case 'unsubscribe':
        if (data.symbol) {
          this.unsubscribeFromSymbol(ws, data.symbol);
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Symbol required for unsubscription'
          }));
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  private subscribeToSymbol(ws: WebSocket, symbol: string) {
    const normalizedSymbol = symbol.toUpperCase();
    
    if (!this.subscriptions.has(normalizedSymbol)) {
      this.subscriptions.set(normalizedSymbol, {
        symbol: normalizedSymbol,
        clients: new Set()
      });
      
      // Subscribe to Bybit WebSocket for this symbol
      this.subscribeToBybitSymbol(normalizedSymbol);
    }

    const subscription = this.subscriptions.get(normalizedSymbol)!;
    subscription.clients.add(ws);

    ws.send(JSON.stringify({
      type: 'subscribed',
      symbol: normalizedSymbol,
      message: `Subscribed to ${normalizedSymbol} market data`
    }));

    console.log(`Client subscribed to ${normalizedSymbol}, total clients: ${subscription.clients.size}`);
  }

  private unsubscribeFromSymbol(ws: WebSocket, symbol: string) {
    const normalizedSymbol = symbol.toUpperCase();
    const subscription = this.subscriptions.get(normalizedSymbol);
    
    if (subscription) {
      subscription.clients.delete(ws);
      
      if (subscription.clients.size === 0) {
        this.subscriptions.delete(normalizedSymbol);
        this.unsubscribeFromBybitSymbol(normalizedSymbol);
      }

      ws.send(JSON.stringify({
        type: 'unsubscribed',
        symbol: normalizedSymbol,
        message: `Unsubscribed from ${normalizedSymbol} market data`
      }));

      console.log(`Client unsubscribed from ${normalizedSymbol}, remaining clients: ${subscription.clients.size}`);
    }
  }

  private removeClientFromAllSubscriptions(ws: WebSocket) {
    for (const [symbol, subscription] of this.subscriptions.entries()) {
      if (subscription.clients.has(ws)) {
        subscription.clients.delete(ws);
        
        if (subscription.clients.size === 0) {
          this.subscriptions.delete(symbol);
          this.unsubscribeFromBybitSymbol(symbol);
        }
      }
    }
  }

  private connectToBybit() {
    try {
      const wsUrl = this.bybitClient.getWebSocketUrl();
      console.log('Connecting to Bybit WebSocket:', wsUrl);
      
      this.bybitWs = new WebSocket(wsUrl);

      this.bybitWs.on('open', () => {
        console.log('Connected to Bybit WebSocket');
        this.reconnectAttempts = 0;
        
        // Resubscribe to all symbols if reconnecting
        for (const symbol of this.subscriptions.keys()) {
          this.subscribeToBybitSymbol(symbol);
        }
      });

      this.bybitWs.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleBybitMessage(message);
        } catch (error) {
          console.error('Error parsing Bybit WebSocket message:', error);
        }
      });

      this.bybitWs.on('close', (code: number, reason: string) => {
        console.log(`Bybit WebSocket closed: ${code} - ${reason}`);
        this.scheduleReconnect();
      });

      this.bybitWs.on('error', (error: Error) => {
        console.error('Bybit WebSocket error:', error);
        this.scheduleReconnect();
      });

    } catch (error) {
      console.error('Failed to connect to Bybit WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Stopping reconnection.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting to Bybit WebSocket in ${this.reconnectInterval}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connectToBybit();
    }, this.reconnectInterval);
  }

  private subscribeToBybitSymbol(symbol: string) {
    if (this.bybitWs && this.bybitWs.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        op: 'subscribe',
        args: [`tickers.${symbol}`]
      };
      
      this.bybitWs.send(JSON.stringify(subscribeMessage));
      console.log(`Subscribed to Bybit ticker for ${symbol}`);
    }
  }

  private unsubscribeFromBybitSymbol(symbol: string) {
    if (this.bybitWs && this.bybitWs.readyState === WebSocket.OPEN) {
      const unsubscribeMessage = {
        op: 'unsubscribe',
        args: [`tickers.${symbol}`]
      };
      
      this.bybitWs.send(JSON.stringify(unsubscribeMessage));
      console.log(`Unsubscribed from Bybit ticker for ${symbol}`);
    }
  }

  private handleBybitMessage(message: any) {
    try {
      // Handle different types of Bybit WebSocket messages
      if (message.topic && message.topic.startsWith('tickers.')) {
        const symbol = message.topic.replace('tickers.', '');
        const tickerData = message.data;
        
        if (tickerData && this.subscriptions.has(symbol)) {
          const normalizedData = {
            type: 'ticker',
            symbol: symbol,
            price: parseFloat(tickerData.lastPrice || '0'),
            change: parseFloat(tickerData.price24hPcnt || '0'),
            volume: parseFloat(tickerData.volume24h || '0'),
            high: parseFloat(tickerData.highPrice24h || '0'),
            low: parseFloat(tickerData.lowPrice24h || '0'),
            bid: parseFloat(tickerData.bid1Price || '0'),
            ask: parseFloat(tickerData.ask1Price || '0'),
            timestamp: Date.now()
          };

          this.broadcastToClients(symbol, normalizedData);
        }
      } else if (message.op === 'subscribe' && message.success) {
        console.log('Successfully subscribed to:', message.args);
      } else if (message.op === 'pong') {
        // Handle pong response
      } else {
        console.log('Unhandled Bybit message:', message);
      }
    } catch (error) {
      console.error('Error handling Bybit message:', error);
    }
  }

  private broadcastToClients(symbol: string, data: any) {
    const subscription = this.subscriptions.get(symbol);
    if (!subscription) return;

    const message = JSON.stringify(data);
    const deadClients: WebSocket[] = [];

    for (const client of subscription.clients) {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        } else {
          deadClients.push(client);
        }
      } catch (error) {
        console.error('Error sending message to client:', error);
        deadClients.push(client);
      }
    }

    // Clean up dead connections
    for (const deadClient of deadClients) {
      subscription.clients.delete(deadClient);
    }

    if (subscription.clients.size === 0) {
      this.subscriptions.delete(symbol);
      this.unsubscribeFromBybitSymbol(symbol);
    }
  }

  // Keep connection alive with periodic pings
  private startHeartbeat() {
    setInterval(() => {
      if (this.bybitWs && this.bybitWs.readyState === WebSocket.OPEN) {
        this.bybitWs.send(JSON.stringify({ op: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  public getConnectionStats() {
    return {
      connectedClients: this.wss.clients.size,
      subscriptions: Array.from(this.subscriptions.entries()).map(([symbol, sub]) => ({
        symbol,
        clientCount: sub.clients.size
      })),
      bybitConnected: this.bybitWs?.readyState === WebSocket.OPEN
    };
  }

  public close() {
    if (this.bybitWs) {
      this.bybitWs.close();
    }
    this.wss.close();
  }
}
