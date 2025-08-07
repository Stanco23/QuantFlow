# QuantFlow Backend API

Express.js backend server providing REST API for cryptocurrency exchange operations via Bybit integration.

## Features

- **Exchange API Integration**: Full Bybit API integration with HMAC SHA256 request signing
- **Order Management**: Place and cancel orders
- **Account Information**: Retrieve account balance
- **Market Data**: Real-time ticker data and historical candlestick data
- **Security**: Helmet.js security middleware and CORS support
- **Logging**: Morgan HTTP request logging
- **TypeScript**: Full TypeScript support with type definitions

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and configure your Bybit API credentials:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your credentials:
   ```env
   PORT=3001
   BYBIT_API_KEY=your_bybit_api_key_here
   BYBIT_API_SECRET=your_bybit_api_secret_here
   BYBIT_TESTNET=true  # Set to false for production
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Start the server**:
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Orders

#### Place Order
```http
POST /api/exchange/orders
Content-Type: application/json

{
  "symbol": "BTCUSDT",
  "side": "Buy",
  "orderType": "Market",
  "qty": "0.001",
  "price": "45000.00",  // Required for limit orders
  "timeInForce": "GTC"  // Optional: GTC, IOC, FOK
}
```

#### Cancel Order
```http
DELETE /api/exchange/orders/:orderId?symbol=BTCUSDT
```

### Account Information

#### Get Balance
```http
GET /api/exchange/balance
```

### Market Data

#### Get Ticker
```http
GET /api/exchange/ticker/BTCUSDT
```

#### Get Historical Data
```http
GET /api/exchange/historical?symbol=BTCUSDT&interval=1&limit=100&start=1640995200000&end=1641081600000
```

**Supported intervals**: 1, 3, 5, 15, 30, 60, 120, 240, 360, 720, D, W, M

### Health Check

```http
GET /health
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Development

- **TypeScript**: Source code is written in TypeScript
- **Hot Reload**: Use `npm run dev` for development with automatic restart
- **Build**: `npm run build` compiles TypeScript to JavaScript in `dist/` directory
- **Clean**: `npm run clean` removes build artifacts

## Security

- All Bybit API requests are signed using HMAC SHA256
- Environment variables are used for sensitive configuration
- Helmet.js provides additional security headers
- CORS is configured for cross-origin requests

## Dependencies

### Production
- `express`: Web framework
- `axios`: HTTP client for API requests
- `cors`: Cross-origin resource sharing
- `helmet`: Security middleware
- `morgan`: HTTP request logger
- `dotenv`: Environment variable management
- `knex`: SQL query builder
- `sqlite3`: SQLite database driver

### Development
- `typescript`: TypeScript compiler
- `ts-node-dev`: TypeScript development server
- `@types/*`: Type definitions for TypeScript

## Error Handling

The API includes comprehensive error handling for:
- Invalid request parameters
- Bybit API errors
- Network connectivity issues
- Authentication failures

All errors are logged and return appropriate HTTP status codes with descriptive error messages.
