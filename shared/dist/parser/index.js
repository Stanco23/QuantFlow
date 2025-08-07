"use strict";
/**
 * Pine-like DSL Parser and Executor for QuantFlow
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
exports.executeNode = executeNode;
exports.execute = execute;
exports.executeBacktest = executeBacktest;
exports.parseDSL = parseDSL;
exports.executeStrategy = executeStrategy;
const nearley = __importStar(require("nearley"));
// Import the compiled grammar
const grammar = require('./simple-grammar.js');
/**
 * Parse a Pine-like expression into an Abstract Syntax Tree
 * @param expression - The expression string to parse
 * @returns Parsed AST
 */
function parse(expression) {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    try {
        parser.feed(expression);
        if (parser.results.length === 0) {
            throw new Error('Parse error: No valid parse found');
        }
        if (parser.results.length > 1) {
            console.warn('Ambiguous parse found, using first result');
        }
        return parser.results[0];
    }
    catch (error) {
        throw new Error(`Parse error: ${error}`);
    }
}
/**
 * Technical indicator functions
 */
class TechnicalIndicators {
    static sma(values, period) {
        const result = [];
        for (let i = 0; i < values.length; i++) {
            if (i < period - 1) {
                result.push(NaN);
            }
            else {
                const sum = values.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
                result.push(sum / period);
            }
        }
        return result;
    }
    static ema(values, period) {
        const result = [];
        const multiplier = 2 / (period + 1);
        for (let i = 0; i < values.length; i++) {
            if (i === 0) {
                result.push(values[i]);
            }
            else {
                const ema = (values[i] - result[i - 1]) * multiplier + result[i - 1];
                result.push(ema);
            }
        }
        return result;
    }
    static rsi(values, period) {
        const result = [];
        const gains = [];
        const losses = [];
        if (values.length < period + 1) {
            // Not enough data for RSI calculation
            return values.map(() => NaN);
        }
        for (let i = 1; i < values.length; i++) {
            const change = values[i] - values[i - 1];
            gains.push(Math.max(change, 0));
            losses.push(Math.max(-change, 0));
        }
        const avgGains = this.sma(gains, period);
        const avgLosses = this.sma(losses, period);
        result.push(NaN); // First value is always NaN
        for (let i = 0; i < avgGains.length; i++) {
            if (isNaN(avgGains[i]) || isNaN(avgLosses[i]) || avgLosses[i] === 0) {
                result.push(50); // Default RSI when no losses
            }
            else {
                const rs = avgGains[i] / avgLosses[i];
                result.push(100 - (100 / (1 + rs)));
            }
        }
        return result;
    }
    static atr(candles, period) {
        const result = [];
        const trueRanges = [];
        for (let i = 1; i < candles.length; i++) {
            const high = candles[i].high;
            const low = candles[i].low;
            const prevClose = candles[i - 1].close;
            const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trueRanges.push(tr);
        }
        const atrValues = this.sma(trueRanges, period);
        result.push(NaN); // First value is always NaN
        return result.concat(atrValues);
    }
    static crossover(series1, series2, currentIndex) {
        // For simplified implementation, we just check if series1 > series2
        // In a full implementation, we'd need historical values to check crossing
        return series1 > series2;
    }
    static crossunder(series1, series2, currentIndex) {
        // For simplified implementation, we just check if series1 < series2
        // In a full implementation, we'd need historical values to check crossing
        return series1 < series2;
    }
}
/**
 * Execute an AST node with given price series data
 * @param ast - The AST to execute
 * @param context - Execution context containing price data and variables
 * @returns The result of execution
 */
function executeNode(ast, context) {
    switch (ast.type) {
        case 'Number':
            return ast.value;
        case 'String':
            return ast.value;
        case 'Identifier':
            const identifier = ast.name;
            if (!context.variables.has(identifier)) {
                throw new Error(`Undefined variable: ${identifier}`);
            }
            return context.variables.get(identifier);
        case 'PriceData':
            const priceField = ast.field;
            const currentCandle = context.candles[context.currentIndex];
            if (!currentCandle) {
                throw new Error(`No candle data at index ${context.currentIndex}`);
            }
            return currentCandle[priceField];
        case 'BinaryOperation':
            const binOp = ast;
            const left = executeNode(binOp.left, context);
            const right = executeNode(binOp.right, context);
            switch (binOp.operator) {
                case '+': return left + right;
                case '-': return left - right;
                case '*': return left * right;
                case '/': return left / right;
                case '%': return left % right;
                case '^': return Math.pow(left, right);
                case '>': return left > right;
                case '>=': return left >= right;
                case '<': return left < right;
                case '<=': return left <= right;
                case '==': return left === right;
                case '!=': return left !== right;
                case 'and': return left && right;
                case 'or': return left || right;
                default:
                    throw new Error(`Unknown binary operator: ${binOp.operator}`);
            }
        case 'UnaryOperation':
            const unaryOp = ast;
            const operand = executeNode(unaryOp.operand, context);
            switch (unaryOp.operator) {
                case '-': return -operand;
                case 'not': return !operand;
                default:
                    throw new Error(`Unknown unary operator: ${unaryOp.operator}`);
            }
        case 'FunctionCall':
            const funcCall = ast;
            const args = funcCall.arguments.map(arg => executeNode(arg, context));
            switch (funcCall.name) {
                // Traditional names
                case 'sma':
                    if (args.length !== 2)
                        throw new Error('sma requires 2 arguments: source, period');
                    const smaSource = context.candles.map(c => c.close);
                    return TechnicalIndicators.sma(smaSource, args[1])[context.currentIndex];
                case 'ema':
                    if (args.length !== 2)
                        throw new Error('ema requires 2 arguments: source, period');
                    const emaSource = context.candles.map(c => c.close);
                    return TechnicalIndicators.ema(emaSource, args[1])[context.currentIndex];
                case 'rsi':
                    if (args.length !== 2)
                        throw new Error('rsi requires 2 arguments: source, period');
                    const rsiSource = context.candles.map(c => c.close);
                    return TechnicalIndicators.rsi(rsiSource, args[1])[context.currentIndex];
                case 'atr':
                    if (args.length !== 1)
                        throw new Error('atr requires 1 argument: period');
                    return TechnicalIndicators.atr(context.candles, args[0])[context.currentIndex];
                // Pine Script ta.* functions
                case 'ta.sma':
                    if (args.length !== 2)
                        throw new Error('ta.sma requires 2 arguments: source, period');
                    const taSmaSource = context.candles.map(c => c.close);
                    return TechnicalIndicators.sma(taSmaSource, args[1])[context.currentIndex];
                case 'ta.ema':
                    if (args.length !== 2)
                        throw new Error('ta.ema requires 2 arguments: source, period');
                    const taEmaSource = context.candles.map(c => c.close);
                    return TechnicalIndicators.ema(taEmaSource, args[1])[context.currentIndex];
                case 'ta.rsi':
                    if (args.length !== 2)
                        throw new Error('ta.rsi requires 2 arguments: source, period');
                    const taRsiSource = context.candles.map(c => c.close);
                    return TechnicalIndicators.rsi(taRsiSource, args[1])[context.currentIndex];
                case 'ta.atr':
                    if (args.length !== 1)
                        throw new Error('ta.atr requires 1 argument: period');
                    return TechnicalIndicators.atr(context.candles, args[0])[context.currentIndex];
                case 'ta.crossover':
                    if (args.length !== 2)
                        throw new Error('ta.crossover requires 2 arguments: series1, series2');
                    return TechnicalIndicators.crossover(args[0], args[1], context.currentIndex);
                case 'ta.crossunder':
                    if (args.length !== 2)
                        throw new Error('ta.crossunder requires 2 arguments: series1, series2');
                    return TechnicalIndicators.crossunder(args[0], args[1], context.currentIndex);
                case 'math.abs':
                    if (args.length !== 1)
                        throw new Error('math.abs requires 1 argument: value');
                    return Math.abs(args[0]);
                case 'math.max':
                    if (args.length !== 2)
                        throw new Error('math.max requires 2 arguments: value1, value2');
                    return Math.max(args[0], args[1]);
                case 'math.min':
                    if (args.length !== 2)
                        throw new Error('math.min requires 2 arguments: value1, value2');
                    return Math.min(args[0], args[1]);
                default:
                    throw new Error(`Unknown function: ${funcCall.name}`);
            }
        case 'Conditional':
            const conditional = ast;
            const condition = executeNode(conditional.condition, context);
            if (condition) {
                return executeNode(conditional.then, context);
            }
            else if (conditional.else) {
                return executeNode(conditional.else, context);
            }
            return null;
        case 'Assignment':
            const assignment = ast;
            const value = executeNode(assignment.expression, context);
            context.variables.set(assignment.identifier, value);
            return value;
        default:
            throw new Error(`Unknown AST node type: ${ast.type}`);
    }
}
/**
 * Execute a complete AST with given price series data
 * @param ast - The AST to execute
 * @param candles - Price data (OHLCV candles)
 * @param variables - Optional initial variables
 * @returns The result of execution
 */
function execute(ast, candles, variables = new Map()) {
    const context = {
        candles,
        variables,
        currentIndex: candles.length - 1 // Default to latest candle
    };
    if (Array.isArray(ast)) {
        let lastResult;
        for (const node of ast) {
            lastResult = executeNode(node, context);
        }
        return lastResult;
    }
    else {
        return executeNode(ast, context);
    }
}
/**
 * Execute expression for backtesting - evaluates expression for each candle
 * @param ast - The AST to execute
 * @param candles - Price data (OHLCV candles)
 * @param variables - Optional initial variables
 * @returns Array of results for each candle
 */
function executeBacktest(ast, candles, variables = new Map()) {
    const results = [];
    const context = {
        candles,
        variables,
        currentIndex: 0
    };
    for (let i = 0; i < candles.length; i++) {
        context.currentIndex = i;
        try {
            if (Array.isArray(ast)) {
                let lastResult;
                for (const node of ast) {
                    lastResult = executeNode(node, context);
                }
                results.push(lastResult);
            }
            else {
                results.push(executeNode(ast, context));
            }
        }
        catch (error) {
            // For backtesting, we might encounter errors on early candles due to insufficient data
            results.push(null);
        }
    }
    return results;
}
function parseDSL(code) {
    const errors = [];
    let ast = null;
    if (!code || code.trim() === '') {
        return { ast: null, errors: ['Empty code provided'] };
    }
    try {
        ast = parse(code);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown parse error';
        errors.push(errorMessage);
    }
    return { ast, errors };
}
/**
 * Execute a strategy AST against current market data to generate trading signals
 * @param ast - The parsed strategy AST
 * @param currentCandles - Map of symbol to current candle data
 * @param positions - Map of symbol to current positions
 * @returns Array of trading signals
 */
function executeStrategy(ast, currentCandles, positions) {
    const signals = [];
    // Convert current candles to the format expected by the execution engine
    for (const [symbol, candleData] of currentCandles.entries()) {
        try {
            // Create a single candle array for this symbol
            const candles = [{
                    timestamp: Date.now(),
                    open: parseFloat(candleData.open || candleData.close),
                    high: parseFloat(candleData.high || candleData.close),
                    low: parseFloat(candleData.low || candleData.close),
                    close: parseFloat(candleData.close),
                    volume: parseFloat(candleData.volume || 0)
                }];
            // Set up execution context with position data
            const variables = new Map();
            const position = positions.get(symbol);
            if (position) {
                variables.set('position_size', parseFloat(position.size || '0'));
                variables.set('position_side', position.side || 'None');
                variables.set('entry_price', parseFloat(position.entryPrice || '0'));
            }
            // Execute the strategy
            const result = execute(ast, candles, variables);
            // Generate signals based on result
            if (typeof result === 'boolean' && result === true) {
                // Simple buy signal
                signals.push({
                    symbol,
                    action: 'BUY',
                    quantity: 1, // Default quantity
                    timestamp: Date.now()
                });
            }
            else if (result === false && position && parseFloat(position.size || '0') > 0) {
                // Sell signal when we have a position
                signals.push({
                    symbol,
                    action: 'SELL',
                    quantity: parseFloat(position.size),
                    timestamp: Date.now()
                });
            }
        }
        catch (error) {
            console.error(`Error executing strategy for ${symbol}:`, error);
            // Continue with other symbols
        }
    }
    return signals;
}
//# sourceMappingURL=index.js.map