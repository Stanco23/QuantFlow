/**
 * Pine-like DSL Parser and Executor for QuantFlow
 */
import { AST, ASTNode } from './ast';
import { Candle } from '../types';
/**
 * Parse a Pine-like expression into an Abstract Syntax Tree
 * @param expression - The expression string to parse
 * @returns Parsed AST
 */
export declare function parse(expression: string): AST;
/**
 * Context for expression execution
 */
export interface ExecutionContext {
    candles: Candle[];
    variables: Map<string, any>;
    currentIndex: number;
}
/**
 * Execute an AST node with given price series data
 * @param ast - The AST to execute
 * @param context - Execution context containing price data and variables
 * @returns The result of execution
 */
export declare function executeNode(ast: ASTNode, context: ExecutionContext): any;
/**
 * Execute a complete AST with given price series data
 * @param ast - The AST to execute
 * @param candles - Price data (OHLCV candles)
 * @param variables - Optional initial variables
 * @returns The result of execution
 */
export declare function execute(ast: AST, candles: Candle[], variables?: Map<string, any>): any;
/**
 * Execute expression for backtesting - evaluates expression for each candle
 * @param ast - The AST to execute
 * @param candles - Price data (OHLCV candles)
 * @param variables - Optional initial variables
 * @returns Array of results for each candle
 */
export declare function executeBacktest(ast: AST, candles: Candle[], variables?: Map<string, any>): any[];
/**
 * Parse DSL code and return AST with error handling
 * @param code - The DSL code to parse
 * @returns Object containing AST and errors
 */
export interface ParseResult {
    ast: AST | null;
    errors: string[];
}
export declare function parseDSL(code: string): ParseResult;
/**
 * Execute a strategy AST against current market data to generate trading signals
 * @param ast - The parsed strategy AST
 * @param currentCandles - Map of symbol to current candle data
 * @param positions - Map of symbol to current positions
 * @returns Array of trading signals
 */
export declare function executeStrategy(ast: AST, currentCandles: Map<string, any>, positions: Map<string, any>): any[];
//# sourceMappingURL=index.d.ts.map