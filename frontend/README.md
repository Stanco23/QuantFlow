# QuantFlow Frontend

This is the frontend application for QuantFlow, built with Next.js and featuring TradingView charts for real-time trading data visualization.

## Setup

The frontend has been configured with:

- **Next.js 15.4.5** with TypeScript
- **TradingView Lightweight Charts v4.1.1** for price charts
- **Axios** for API communication
- **Monaco Editor** for code editing capabilities
- **Tailwind CSS** for styling
- **ESLint & Prettier** for code quality

## Key Features

### 1. Chart Component (`src/components/Chart.tsx`)
- Interactive candlestick charts using TradingView lightweight-charts
- Real-time data visualization
- Responsive design
- Customizable height, width, and symbol display

### 2. API Service Layer (`src/services/api.ts`)
- Centralized API communication using Axios
- Endpoints for market data, orders, and portfolio
- Error handling and authentication interceptors
- Fallback to demo data when API is unavailable

### 3. Pages
- **Dashboard** (`src/pages/index.tsx`): Market overview with interactive charts
- **Trading** (`src/pages/trading.tsx`): Full trading interface with order placement
- **Global App Layout** (`src/pages/_app.tsx`): Navigation and theme setup

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Integration

The frontend connects to the backend REST API at `http://localhost:3001/api` with endpoints for:

- `/market-data` - Real-time market data
- `/market-data/{symbol}/candlesticks` - Historical price data
- `/orders` - Order management
- `/portfolio` - Portfolio and positions

## Demo Mode

When the backend API is unavailable, the frontend automatically falls back to:
- Generated sample candlestick data
- Mock market data
- Demo order simulation

## Project Structure

```
src/
├── components/
│   └── Chart.tsx          # TradingView chart component
├── pages/
│   ├── _app.tsx           # Global app layout
│   ├── index.tsx          # Dashboard page
│   └── trading.tsx        # Trading interface
├── services/
│   └── api.ts             # API service layer
└── styles/
    └── globals.css        # Global styles
```
