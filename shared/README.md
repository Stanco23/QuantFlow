# QuantFlow Shared Module

This module provides shared types and a Pine-like DSL parser for the QuantFlow trading system.

## Features Implemented

### 📋 Shared Types

- **Candle**: OHLCV candlestick data structure
- **Order**: Trading order with status and execution details  
- **StrategyConfig**: Strategy configuration with parameters and DSL expression
- **BacktestResult**: Comprehensive backtesting results with metrics
- **Position**: Current position information
- **MarketData**: Market data container

### 🔗 DSL Parser

The parser supports a Pine Script-like language for trading strategy expressions.

#### Supported Syntax

**Basic Expressions:**
```pine
42                    // Numbers
"hello world"         // Strings  
close > 100          // Price data comparisons
10 + 20 * 3          // Arithmetic with precedence
(2 + 3) * 4          // Parentheses for grouping
```

**Price Data References:**
```pine
open                 // Opening price
high                 // High price  
low                  // Low price
close                // Closing price
volume               // Volume data
```

**Technical Indicators:**
```pine
sma(close, 20)       // Simple Moving Average
ema(close, 20)       // Exponential Moving Average  
rsi(close, 14)       // Relative Strength Index
atr(close, 14)       // Average True Range
```

**Logical Operations:**
```pine
close > sma(close, 20) and volume > 1000
rsi(close, 14) < 30 or rsi(close, 14) > 70
not (close < open)
```

**Comparison Operators:**
- `>`, `>=`, `<`, `<=`, `==`, `!=`

**Logical Operators:**  
- `and`, `or`, `not`

**Arithmetic Operators:**
- `+`, `-`, `*`, `/`, `%`, `^`

#### Usage Examples

```typescript
import { parse, execute, executeBacktest } from '@quantflow/shared';

// Parse an expression
const ast = parse('close > sma(close, 20) and volume > 1000');

// Execute for current candle
const result = execute(ast, candleData);

// Execute for backtesting (all candles)
const results = executeBacktest(ast, candleData);

// Execute with variables
const variables = new Map();
variables.set('threshold', 100);
const result2 = execute(parse('close > threshold'), candleData, variables);
```

### 🏗️ Architecture

**Grammar Definition:** `src/parser/simple-grammar.ne`
- Nearley.js grammar for parsing Pine-like syntax
- Handles operator precedence and associativity
- Generates JavaScript parser automatically

**AST Types:** `src/parser/ast.ts`  
- TypeScript interfaces for Abstract Syntax Tree nodes
- Strongly typed node structure for safety

**Parser & Executor:** `src/parser/index.ts`
- `parse()`: Converts expressions to AST
- `execute()`: Evaluates AST with current market data
- `executeBacktest()`: Evaluates across historical data
- Built-in technical indicators implementation

### 🧪 Testing

Comprehensive test suite covering:
- Expression parsing for all supported syntax
- Execution accuracy for mathematical operations  
- Technical indicator calculations
- Error handling for invalid syntax
- Backtesting functionality
- Edge cases and boundary conditions

Run tests:
```bash
npm test
```

### 🔧 Build System

**Build Process:**
1. Generate parser from grammar: `npm run build:grammar`
2. Compile TypeScript: `npm run build:ts`  
3. Complete build: `npm run build`

**Generated Files:**
- `src/parser/simple-grammar.js` - Generated parser
- `dist/` - Compiled TypeScript output with declarations

### 📦 Dependencies

**Production:**
- `nearley` - Parser generator
- `moo` - Lexical analyzer

**Development:**  
- `typescript` - TypeScript compiler
- `jest` - Testing framework
- `@types/nearley` - TypeScript definitions

### 🚀 Future Enhancements

The parser foundation supports extending to:

- Conditional expressions (`if-then-else`)
- Variable assignments  
- Strategy definitions with buy/sell rules
- More technical indicators (MACD, Bollinger Bands, Stochastic)
- Multi-timeframe analysis
- Custom function definitions

### 📄 License

ISC License - Part of the QuantFlow trading system.
