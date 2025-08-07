# QuantFlow Trading Platform

A comprehensive algorithmic trading platform built with modern web technologies, featuring Pine Script-inspired strategy development, backtesting, portfolio management, and live trading capabilities.

## 🚀 Features

### 🎯 **Strategy Development**
- **Advanced Code Editor**: Monaco-based editor with Pine Script-like syntax highlighting
- **IntelliSense Support**: Auto-completion for technical indicators, price data, and operators
- **Real-time Validation**: Server-side strategy validation with error highlighting
- **Strategy Management**: Create, edit, save, and organize trading strategies

### 📊 **Backtesting Engine**
- **Historical Testing**: Test strategies against historical market data
- **Performance Metrics**: Comprehensive analytics including Sharpe ratio, drawdown, win rate
- **Visual Results**: Equity curves and trade analysis charts
- **Multi-timeframe Support**: Test across different time intervals

### 💼 **Portfolio Management**
- **Real-time Monitoring**: Track positions, P&L, and portfolio performance
- **Risk Analysis**: Advanced risk metrics and position sizing
- **Asset Allocation**: Visual portfolio breakdown and rebalancing tools
- **Performance Tracking**: Historical portfolio performance analysis

### 🔴 **Live Trading**
- **Bybit Integration**: Direct connection to Bybit exchange API
- **Real-time Data**: WebSocket connections for live market data
- **Order Management**: Advanced order types and execution
- **Risk Controls**: Position limits and automated risk management

### 🧠 **DSL Parser**
- **Pine Script-inspired**: Familiar syntax for TradingView users
- **Technical Indicators**: Built-in support for SMA, EMA, RSI, MACD, and more
- **Execution Engine**: Fast strategy execution and signal generation
- **Grammar Validation**: Robust parsing with detailed error messages

## 🏗️ Architecture

QuantFlow is built as a monorepo with the following structure:

```
QuantFlow/
├── frontend/          # Next.js React frontend
├── backend/           # Express.js API server
├── shared/            # Shared DSL parser and utilities
├── database/          # SQLite database and migrations
└── strategies/        # Example trading strategies
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with SSR
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Monaco Editor** - VSCode-powered code editor
- **LightWeight Charts** - High-performance financial charts
- **Axios** - HTTP client for API communication

### Backend
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **SQLite** - Lightweight database
- **Knex.js** - SQL query builder and migrations
- **WebSocket** - Real-time data connections
- **Bybit API** - Exchange integration

### Shared
- **Nearley** - Grammar-based parser generator
- **Moo** - Lexical analyzer
- **Custom DSL** - Pine Script-inspired trading language

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd QuantFlow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

4. **Run database migrations**:
   ```bash
   npm run migrate --workspace=backend
   ```

5. **Build shared modules**:
   ```bash
   npm run build --workspace=shared
   ```

## 🎮 Development Commands

### Full Stack Development
- **`npm run dev`** - Build shared modules and start both backend and frontend
- **`npm run dev:quick`** - Start both services without rebuilding shared modules
- **`npm run start`** - Start both backend and frontend in production mode
- **`npm run build`** - Build all components (shared, backend, frontend)

### Individual Services
- **`npm run dev:backend`** - Start only the backend server
- **`npm run dev:frontend`** - Start only the frontend application
- **`npm run build:backend`** - Build only the backend
- **`npm run build:frontend`** - Build only the frontend
- **`npm run build:shared`** - Build only the shared parser module

### Database & Maintenance
- **`npm run migrate`** - Run database migrations
- **`npm run clean`** - Clean build artifacts from all workspaces

### Testing & Quality
- **`npm run test`** - Run all tests
- **`npm run test:unit`** - Run unit tests only
- **`npm run test:integration`** - Run integration tests only
- **`npm run test:watch`** - Run tests in watch mode
- **`npm run test:coverage`** - Run tests with coverage report
- **`npm run lint`** - Lint all TypeScript files
- **`npm run format`** - Format all files with Prettier

## 🌐 Application URLs

When running in development mode:
- **Frontend**: http://localhost:3001 (or next available port)
- **Backend API**: http://localhost:3000
- **Database**: SQLite file at `backend/database/quantflow.db`

## 📱 Usage Guide

### 1. Strategy Development
1. Navigate to `/strategies`
2. Click "New" to create a strategy
3. Write your Pine Script-like code in the editor
4. Use auto-completion for indicators: `ta.sma()`, `ta.rsi()`, etc.
5. Save your strategy when validation passes

### 2. Backtesting
1. Go to `/backtesting`
2. Select a strategy from the dropdown
3. Configure symbol, timeframe, and date range
4. Click "Run Backtest" to see results
5. Analyze performance metrics and equity curves

### 3. Portfolio Management
1. Visit `/portfolio`
2. Monitor current positions and P&L
3. View asset allocation and balance details
4. Track overall portfolio performance

### 4. Live Trading
1. Access `/trading`
2. Configure API credentials in settings
3. Enable live trading mode
4. Monitor real-time positions and orders

## 🔧 Configuration

### Environment Variables

Create `backend/.env` file:

```env
# Database
DATABASE_PATH=./database/quantflow.db

# Bybit API
BYBIT_API_KEY=your_api_key
BYBIT_SECRET=your_secret
BYBIT_TESTNET=true

# Server Configuration
PORT=3000
NODE_ENV=development

# WebSocket Configuration
WS_PORT=3001
```

### Strategy DSL Syntax

```javascript
// Price data access
close, open, high, low, volume

// Technical indicators
ta.sma(close, 14)      // Simple Moving Average
ta.ema(close, 21)      // Exponential Moving Average
ta.rsi(close, 14)      // Relative Strength Index
ta.macd(close, 12, 26, 9)  // MACD
ta.bb(close, 20, 2)    // Bollinger Bands

// Crossover functions
ta.crossover(fast, slow)   // Fast crosses over slow
ta.crossunder(fast, slow)  // Fast crosses under slow

// Math functions
math.abs(value)
math.max(a, b)
math.min(a, b)

// Conditional logic
if (condition) {
  // Trading logic
}
```

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Parser Tests**: DSL grammar and execution testing
- **API Tests**: Backend endpoint testing

Run tests with:
```bash
npm run test:coverage
```

## 📈 Performance

- **Fast Compilation**: TypeScript with incremental builds
- **Optimized Charts**: Lightweight Charts for high-performance rendering
- **Efficient Parsing**: Nearley-based DSL parser
- **Real-time Updates**: WebSocket connections for live data
- **Database Optimization**: Indexed queries and connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is for educational and research purposes only. Trading cryptocurrencies and other financial instruments involves substantial risk and is not suitable for every investor. Past performance is not indicative of future results. Always consult with a financial advisor and do your own research before making investment decisions.

## 🆘 Support

- **Issues**: [GitHub Issues](issues)
- **Documentation**: See individual workspace README files
- **Wiki**: [Project Wiki](wiki)

---

Built with ❤️ for the algorithmic trading community
