# Bybit API Client Tests

This directory contains comprehensive test suites for the Bybit API client implementation.

## Test Files

### Unit Tests
- **`bybitClient.test.ts`** - Unit tests with mocked HTTP requests
  - Tests all public methods of the BybitClient class
  - Validates signature generation (HMAC SHA256)
  - Tests error handling and edge cases
  - Mocks axios to avoid real API calls

### Integration Tests  
- **`bybitClient.integration.test.ts`** - Integration tests with real/sandbox API
  - Can be run against Bybit testnet or mainnet (testnet recommended)
  - Requires valid API keys set as environment variables
  - Tests actual API connectivity and response parsing
  - Includes performance and rate limiting tests

## Environment Setup

### For Integration Tests

Set the following environment variables:

```bash
# Required for integration tests
export BYBIT_API_KEY="your_bybit_api_key"
export BYBIT_API_SECRET="your_bybit_api_secret"

# Optional (defaults to true for safety)
export BYBIT_TESTNET="true"  # Set to "false" for mainnet (not recommended for testing)
```

**⚠️ Important**: Always use testnet API keys for testing. Never use mainnet keys in automated tests.

## Running Tests

```bash
# Run unit tests only
npm run test:unit

# Run integration tests only  
npm run test:integration

# Run all tests
npm test

# Run specific test file
npm run test:unit -- --testPathPatterns=bybitClient.test.ts

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The test suite covers:

### Core Functionality
- ✅ API client initialization with correct configuration
- ✅ HMAC SHA256 signature generation and validation
- ✅ HTTP request handling with proper headers and authentication
- ✅ Response parsing and data transformation

### API Methods
- ✅ `getMarketData()` - Market data for symbols
- ✅ `getHistorical()` - Historical candlestick data  
- ✅ `placeOrder()` - Order placement (market/limit)
- ✅ `cancelOrder()` - Order cancellation
- ✅ `getPositions()` - Open positions
- ✅ `getBalance()` - Account balance

### Error Handling
- ✅ API error responses (non-zero retCode)
- ✅ Network connectivity issues
- ✅ HTTP status errors (4xx, 5xx)
- ✅ Signature generation failures
- ✅ Invalid parameters and edge cases

### Edge Cases
- ✅ Empty responses
- ✅ Malformed data
- ✅ Timeout handling
- ✅ Rate limiting scenarios
- ✅ Data consistency validation

## Bybit API Endpoints Tested

### Public Endpoints (No Authentication)
- `GET /v5/market/tickers` - Market data
- `GET /v5/market/kline` - Historical candles

### Private Endpoints (Require Authentication)  
- `GET /v5/account/wallet-balance` - Account balance
- `GET /v5/position/list` - Open positions
- `POST /v5/order/create` - Place order
- `POST /v5/order/cancel` - Cancel order

## Test Data Validation

The tests validate:
- **Data Types**: Strings, numbers, arrays as expected
- **Data Ranges**: Prices > 0, valid timestamps, percentage calculations
- **Data Relationships**: OHLC relationships (High >= Open, Close, Low)
- **API Consistency**: Same symbol returns consistent structure across calls
- **Time Ordering**: Historical data in correct chronological order

## Integration Test Safety Features

- **Automatic Skipping**: Integration tests skip if no API keys provided
- **Testnet Default**: Uses testnet by default for safety
- **Order Placement**: Real order tests are skipped by default (`.skip`)
- **Small Amounts**: Test orders use minimal quantities
- **Immediate Cancellation**: Test orders are cancelled immediately after placement
- **Error Graceful**: API errors are logged as warnings, not failures

## Performance Benchmarks

Integration tests include performance validation:
- API response time < 30 seconds
- Concurrent request handling
- Multiple symbol data retrieval
- Rate limiting compliance

## Contributing

When adding new tests:

1. **Unit Tests**: Mock all external dependencies
2. **Integration Tests**: Use testnet and small amounts only
3. **Documentation**: Update this README with new test coverage
4. **Error Handling**: Test both success and failure scenarios
5. **Edge Cases**: Consider empty, malformed, and boundary conditions

## Troubleshooting

### Common Issues

**Integration tests not running**:
- Ensure `BYBIT_API_KEY` and `BYBIT_API_SECRET` environment variables are set
- Check that keys are valid for the specified environment (testnet/mainnet)

**API errors during integration tests**:
- Verify API keys have required permissions
- Check Bybit API status and rate limits
- Ensure testnet is accessible

**Signature validation failures**:
- Verify API secret is correct
- Check system time synchronization
- Review parameter encoding and sorting

**Network timeout errors**:
- Check internet connectivity
- Verify firewall settings allow HTTPS to Bybit API endpoints
- Consider proxy configuration if applicable
