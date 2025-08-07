import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import exchangeRouter from './routes/exchange';
import parserRouter from './routes/parser';
import backtestRouter from './routes/backtest';
import portfolioRouter from './routes/portfolio';
import liveRouter from './routes/live';
import strategiesRouter from './routes/strategies';
import { WebSocketService } from './services/websocketService';
import { BybitClient } from './services/bybitClient';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/api/exchange', exchangeRouter);
app.use('/api/parser', parserRouter);
app.use('/api/backtest', backtestRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/live', liveRouter);
app.use('/api/strategies', strategiesRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = createServer(app);

// Initialize Bybit client for WebSocket service
const bybitClient = new BybitClient(
  process.env.BYBIT_API_KEY || '',
  process.env.BYBIT_API_SECRET || '',
  process.env.BYBIT_TESTNET === 'true'
);

// Initialize WebSocket service
const wsService = new WebSocketService(server, bybitClient);

// Add WebSocket stats endpoint
app.get('/api/ws/stats', (req, res) => {
  res.json(wsService.getConnectionStats());
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket service available at ws://localhost:${PORT}/ws`);
});
