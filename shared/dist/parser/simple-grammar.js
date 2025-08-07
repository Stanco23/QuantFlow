// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const moo = require('moo');

const lexer = moo.compile({
  ws: /[ \t]+/,
  newline: { match: /\n/, lineBreaks: true },
  comment: /\/\/.*$/,
  number: /\d+(?:\.\d+)?/,
  string: /"[^"]*"|'[^']*'/,
  
  // Pine Script specific
  assign: ':=',
  version: /\/\/@version=\d+/,
  
  // Comparison operators (order matters)
  gte: '>=',
  lte: '<=',
  gt: '>',
  lt: '<',
  eq: '==',
  ne: '!=',
  
  // Logical operators
  and: 'and',
  or: 'or',
  not: 'not',
  
  // Arithmetic operators
  plus: '+',
  minus: '-',
  multiply: '*',
  divide: '/',
  modulo: '%',
  power: '^',
  
  // Punctuation
  lparen: '(',
  rparen: ')',
  comma: ',',
  
  // Pine Script keywords
  strategy: 'strategy',
  if_: 'if',
  buy: 'strategy.entry',
  sell: 'strategy.close',
  crossover: 'ta.crossover',
  crossunder: 'ta.crossunder',
  barssince: 'barssince',
  
  // Technical analysis functions
  ta_sma: 'ta.sma',
  ta_ema: 'ta.ema', 
  ta_rsi: 'ta.rsi',
  ta_atr: 'ta.atr',
  ta_macd: 'ta.macd',
  ta_bb: 'ta.bb',
  ta_stoch: 'ta.stoch',
  ta_cci: 'ta.cci',
  
  // Math functions
  math_abs: 'math.abs',
  math_max: 'math.max',
  math_min: 'math.min',
  
  // Price data
  open: 'open',
  high: 'high',
  low: 'low',
  close: 'close',
  volume: 'volume',
  
  // Variables and identifiers (must come last)
  identifier: /[a-zA-Z_][a-zA-Z0-9_]*/,
});

lexer.next = (next => () => {
  let tok;
  while ((tok = next.call(lexer)) && (tok.type === 'ws' || tok.type === 'comment')) {
    // skip whitespace and comments
  }
  return tok;
})(lexer.next);

function buildBinaryOp(left, op, right) {
  return {
    type: 'BinaryOperation',
    operator: op,
    left: left,
    right: right
  };
}

function buildUnaryOp(op, operand) {
  return {
    type: 'UnaryOperation',
    operator: op,
    operand: operand
  };
}

function buildFunctionCall(name, args) {
  return {
    type: 'FunctionCall',
    name: name,
    arguments: args || []
  };
}
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main", "symbols": ["expression"], "postprocess": id},
    {"name": "expression", "symbols": ["logical_or"], "postprocess": id},
    {"name": "logical_or$ebnf$1", "symbols": []},
    {"name": "logical_or$ebnf$1$subexpression$1", "symbols": [(lexer.has("or") ? {type: "or"} : or), "logical_and"]},
    {"name": "logical_or$ebnf$1", "symbols": ["logical_or$ebnf$1", "logical_or$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "logical_or", "symbols": ["logical_and", "logical_or$ebnf$1"], "postprocess": d => d[1].reduce((acc, curr) => buildBinaryOp(acc, 'or', curr[1]), d[0])},
    {"name": "logical_and$ebnf$1", "symbols": []},
    {"name": "logical_and$ebnf$1$subexpression$1", "symbols": [(lexer.has("and") ? {type: "and"} : and), "equality"]},
    {"name": "logical_and$ebnf$1", "symbols": ["logical_and$ebnf$1", "logical_and$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "logical_and", "symbols": ["equality", "logical_and$ebnf$1"], "postprocess": d => d[1].reduce((acc, curr) => buildBinaryOp(acc, 'and', curr[1]), d[0])},
    {"name": "equality$ebnf$1", "symbols": []},
    {"name": "equality$ebnf$1$subexpression$1$subexpression$1", "symbols": [(lexer.has("eq") ? {type: "eq"} : eq)]},
    {"name": "equality$ebnf$1$subexpression$1$subexpression$1", "symbols": [(lexer.has("ne") ? {type: "ne"} : ne)]},
    {"name": "equality$ebnf$1$subexpression$1", "symbols": ["equality$ebnf$1$subexpression$1$subexpression$1", "comparison"]},
    {"name": "equality$ebnf$1", "symbols": ["equality$ebnf$1", "equality$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "equality", "symbols": ["comparison", "equality$ebnf$1"], "postprocess": d => d[1].reduce((acc, curr) => buildBinaryOp(acc, curr[0][0].value, curr[1]), d[0])},
    {"name": "comparison$ebnf$1", "symbols": []},
    {"name": "comparison$ebnf$1$subexpression$1$subexpression$1", "symbols": [(lexer.has("gt") ? {type: "gt"} : gt)]},
    {"name": "comparison$ebnf$1$subexpression$1$subexpression$1", "symbols": [(lexer.has("gte") ? {type: "gte"} : gte)]},
    {"name": "comparison$ebnf$1$subexpression$1$subexpression$1", "symbols": [(lexer.has("lt") ? {type: "lt"} : lt)]},
    {"name": "comparison$ebnf$1$subexpression$1$subexpression$1", "symbols": [(lexer.has("lte") ? {type: "lte"} : lte)]},
    {"name": "comparison$ebnf$1$subexpression$1", "symbols": ["comparison$ebnf$1$subexpression$1$subexpression$1", "additive"]},
    {"name": "comparison$ebnf$1", "symbols": ["comparison$ebnf$1", "comparison$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "comparison", "symbols": ["additive", "comparison$ebnf$1"], "postprocess": d => d[1].reduce((acc, curr) => buildBinaryOp(acc, curr[0][0].value, curr[1]), d[0])},
    {"name": "additive$ebnf$1", "symbols": []},
    {"name": "additive$ebnf$1$subexpression$1$subexpression$1", "symbols": [(lexer.has("plus") ? {type: "plus"} : plus)]},
    {"name": "additive$ebnf$1$subexpression$1$subexpression$1", "symbols": [(lexer.has("minus") ? {type: "minus"} : minus)]},
    {"name": "additive$ebnf$1$subexpression$1", "symbols": ["additive$ebnf$1$subexpression$1$subexpression$1", "multiplicative"]},
    {"name": "additive$ebnf$1", "symbols": ["additive$ebnf$1", "additive$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "additive", "symbols": ["multiplicative", "additive$ebnf$1"], "postprocess": d => d[1].reduce((acc, curr) => buildBinaryOp(acc, curr[0][0].value, curr[1]), d[0])},
    {"name": "multiplicative$ebnf$1", "symbols": []},
    {"name": "multiplicative$ebnf$1$subexpression$1$subexpression$1", "symbols": [(lexer.has("multiply") ? {type: "multiply"} : multiply)]},
    {"name": "multiplicative$ebnf$1$subexpression$1$subexpression$1", "symbols": [(lexer.has("divide") ? {type: "divide"} : divide)]},
    {"name": "multiplicative$ebnf$1$subexpression$1$subexpression$1", "symbols": [(lexer.has("modulo") ? {type: "modulo"} : modulo)]},
    {"name": "multiplicative$ebnf$1$subexpression$1", "symbols": ["multiplicative$ebnf$1$subexpression$1$subexpression$1", "power"]},
    {"name": "multiplicative$ebnf$1", "symbols": ["multiplicative$ebnf$1", "multiplicative$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "multiplicative", "symbols": ["power", "multiplicative$ebnf$1"], "postprocess": d => d[1].reduce((acc, curr) => buildBinaryOp(acc, curr[0][0].value, curr[1]), d[0])},
    {"name": "power$ebnf$1", "symbols": []},
    {"name": "power$ebnf$1$subexpression$1", "symbols": [(lexer.has("power") ? {type: "power"} : power), "unary"]},
    {"name": "power$ebnf$1", "symbols": ["power$ebnf$1", "power$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "power", "symbols": ["unary", "power$ebnf$1"], "postprocess": d => d[1].reduce((acc, curr) => buildBinaryOp(acc, '^', curr[1]), d[0])},
    {"name": "unary", "symbols": [(lexer.has("not") ? {type: "not"} : not), "unary"], "postprocess": d => buildUnaryOp('not', d[1])},
    {"name": "unary", "symbols": [(lexer.has("minus") ? {type: "minus"} : minus), "unary"], "postprocess": d => buildUnaryOp('-', d[1])},
    {"name": "unary", "symbols": ["primary"], "postprocess": id},
    {"name": "primary", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => ({ type: 'Number', value: parseFloat(d[0].value) })},
    {"name": "primary", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => ({ type: 'String', value: d[0].value.slice(1, -1) })},
    {"name": "primary", "symbols": ["function_call"], "postprocess": id},
    {"name": "primary", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => ({ type: 'Identifier', name: d[0].value })},
    {"name": "primary", "symbols": ["price_data"], "postprocess": id},
    {"name": "primary", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "expression", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => d[1]},
    {"name": "function_call", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), (lexer.has("lparen") ? {type: "lparen"} : lparen), "argument_list", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => buildFunctionCall(d[0].value, d[2])},
    {"name": "price_data", "symbols": [(lexer.has("open") ? {type: "open"} : open)], "postprocess": d => ({ type: 'PriceData', field: 'open' })},
    {"name": "price_data", "symbols": [(lexer.has("high") ? {type: "high"} : high)], "postprocess": d => ({ type: 'PriceData', field: 'high' })},
    {"name": "price_data", "symbols": [(lexer.has("low") ? {type: "low"} : low)], "postprocess": d => ({ type: 'PriceData', field: 'low' })},
    {"name": "price_data", "symbols": [(lexer.has("close") ? {type: "close"} : close)], "postprocess": d => ({ type: 'PriceData', field: 'close' })},
    {"name": "price_data", "symbols": [(lexer.has("volume") ? {type: "volume"} : volume)], "postprocess": d => ({ type: 'PriceData', field: 'volume' })},
    {"name": "argument_list$ebnf$1", "symbols": []},
    {"name": "argument_list$ebnf$1$subexpression$1", "symbols": [(lexer.has("comma") ? {type: "comma"} : comma), "expression"]},
    {"name": "argument_list$ebnf$1", "symbols": ["argument_list$ebnf$1", "argument_list$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "argument_list", "symbols": ["expression", "argument_list$ebnf$1"], "postprocess": d => [d[0]].concat(d[1].map(item => item[1]))},
    {"name": "argument_list", "symbols": [], "postprocess": () => []}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
