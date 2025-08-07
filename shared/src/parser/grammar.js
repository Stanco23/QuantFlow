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
  string: /"[^"]*"/,
  
  // Operators (order matters - longer ones first)
  and: 'and',
  or: 'or',
  not: 'not',
  
  // Comparison operators
  gte: '>=',
  lte: '<=',
  gt: '>',
  lt: '<',
  eq: '==',
  ne: '!=',
  
  // Arithmetic operators
  plus: '+',
  minus: '-',
  multiply: '*',
  divide: '/',
  modulo: '%',
  power: '^',
  
  // Assignment
  assign: '=',
  
  // Punctuation
  lparen: '(',
  rparen: ')',
  lbracket: '[',
  rbracket: ']',
  comma: ',',
  dot: '.',
  
  // Technical indicators and functions
  sma: 'sma',
  ema: 'ema',
  rsi: 'rsi',
  macd: 'macd',
  bb: 'bb',
  stoch: 'stoch',
  atr: 'atr',
  
  // Price data
  open: 'open',
  high: 'high',
  low: 'low',
  close: 'close',
  volume: 'volume',
  
  // Control flow
  if: 'if',
  then: 'then',
  else: 'else',
  
  // Strategy functions
  strategy: 'strategy',
  buy: 'buy',
  sell: 'sell',
  
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

function buildAssignment(identifier, expression) {
  return {
    type: 'Assignment',
    identifier: identifier,
    expression: expression
  };
}

function buildConditional(condition, thenExpr, elseExpr) {
  return {
    type: 'Conditional',
    condition: condition,
    then: thenExpr,
    else: elseExpr
  };
}

function buildStrategy(name, rules) {
  return {
    type: 'Strategy',
    name: name,
    rules: rules
  };
}
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main", "symbols": ["statements"], "postprocess": id},
    {"name": "statements$ebnf$1", "symbols": []},
    {"name": "statements$ebnf$1", "symbols": ["statements$ebnf$1", "statement"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "statements", "symbols": ["statements$ebnf$1"], "postprocess": d => d[0].filter(s => s !== null)},
    {"name": "statement$ebnf$1", "symbols": [(lexer.has("newline") ? {type: "newline"} : newline)], "postprocess": id},
    {"name": "statement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "statement", "symbols": ["assignment", "statement$ebnf$1"], "postprocess": id},
    {"name": "statement$ebnf$2", "symbols": [(lexer.has("newline") ? {type: "newline"} : newline)], "postprocess": id},
    {"name": "statement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "statement", "symbols": ["expression", "statement$ebnf$2"], "postprocess": id},
    {"name": "statement$ebnf$3", "symbols": [(lexer.has("newline") ? {type: "newline"} : newline)], "postprocess": id},
    {"name": "statement$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "statement", "symbols": ["strategy", "statement$ebnf$3"], "postprocess": id},
    {"name": "statement$ebnf$4", "symbols": [(lexer.has("newline") ? {type: "newline"} : newline)], "postprocess": id},
    {"name": "statement$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "statement", "symbols": ["conditional", "statement$ebnf$4"], "postprocess": id},
    {"name": "statement", "symbols": [(lexer.has("newline") ? {type: "newline"} : newline)], "postprocess": () => null},
    {"name": "assignment", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), (lexer.has("assign") ? {type: "assign"} : assign), "expression"], "postprocess": d => buildAssignment(d[0].value, d[2])},
    {"name": "strategy$ebnf$1", "symbols": [(lexer.has("newline") ? {type: "newline"} : newline)], "postprocess": id},
    {"name": "strategy$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "strategy", "symbols": [(lexer.has("strategy") ? {type: "strategy"} : strategy), (lexer.has("lparen") ? {type: "lparen"} : lparen), (lexer.has("string") ? {type: "string"} : string), (lexer.has("rparen") ? {type: "rparen"} : rparen), "strategy$ebnf$1", "strategy_rules"], "postprocess": d => buildStrategy(d[2].value.slice(1, -1), d[5])},
    {"name": "strategy_rules$ebnf$1", "symbols": []},
    {"name": "strategy_rules$ebnf$1", "symbols": ["strategy_rules$ebnf$1", "strategy_rule"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "strategy_rules", "symbols": ["strategy_rules$ebnf$1"], "postprocess": id},
    {"name": "strategy_rule$ebnf$1", "symbols": [(lexer.has("newline") ? {type: "newline"} : newline)], "postprocess": id},
    {"name": "strategy_rule$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "strategy_rule", "symbols": ["buy_condition", "strategy_rule$ebnf$1"], "postprocess": id},
    {"name": "strategy_rule$ebnf$2", "symbols": [(lexer.has("newline") ? {type: "newline"} : newline)], "postprocess": id},
    {"name": "strategy_rule$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "strategy_rule", "symbols": ["sell_condition", "strategy_rule$ebnf$2"], "postprocess": id},
    {"name": "buy_condition", "symbols": [(lexer.has("if") ? {type: "if"} : if), "expression", (lexer.has("then") ? {type: "then"} : then), (lexer.has("buy") ? {type: "buy"} : buy)], "postprocess": d => ({ type: 'BuyCondition', condition: d[1] })},
    {"name": "sell_condition", "symbols": [(lexer.has("if") ? {type: "if"} : if), "expression", (lexer.has("then") ? {type: "then"} : then), (lexer.has("sell") ? {type: "sell"} : sell)], "postprocess": d => ({ type: 'SellCondition', condition: d[1] })},
    {"name": "conditional$ebnf$1$subexpression$1", "symbols": [(lexer.has("else") ? {type: "else"} : else), "expression"]},
    {"name": "conditional$ebnf$1", "symbols": ["conditional$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "conditional$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "conditional", "symbols": [(lexer.has("if") ? {type: "if"} : if), "expression", (lexer.has("then") ? {type: "then"} : then), "expression", "conditional$ebnf$1"], "postprocess": d => buildConditional(d[1], d[3], d[4] ? d[4][1] : null)},
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
    {"name": "unary", "symbols": ["postfix"], "postprocess": id},
    {"name": "postfix$ebnf$1", "symbols": []},
    {"name": "postfix$ebnf$1$subexpression$1", "symbols": [(lexer.has("lbracket") ? {type: "lbracket"} : lbracket), "expression", (lexer.has("rbracket") ? {type: "rbracket"} : rbracket)]},
    {"name": "postfix$ebnf$1", "symbols": ["postfix$ebnf$1", "postfix$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "postfix", "symbols": ["primary", "postfix$ebnf$1"], "postprocess": d => d[1].reduce((acc, curr) => ({ type: 'IndexAccess', object: acc, index: curr[1] }), d[0])},
    {"name": "primary", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => ({ type: 'Number', value: parseFloat(d[0].value) })},
    {"name": "primary", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => ({ type: 'String', value: d[0].value.slice(1, -1) })},
    {"name": "primary", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), (lexer.has("lparen") ? {type: "lparen"} : lparen), "argument_list", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => buildFunctionCall(d[0].value, d[2])},
    {"name": "primary", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => ({ type: 'Identifier', name: d[0].value })},
    {"name": "primary", "symbols": ["price_data"], "postprocess": id},
    {"name": "primary", "symbols": ["technical_indicator"], "postprocess": id},
    {"name": "primary", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "expression", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => d[1]},
    {"name": "price_data", "symbols": [(lexer.has("open") ? {type: "open"} : open)], "postprocess": d => ({ type: 'PriceData', field: 'open' })},
    {"name": "price_data", "symbols": [(lexer.has("high") ? {type: "high"} : high)], "postprocess": d => ({ type: 'PriceData', field: 'high' })},
    {"name": "price_data", "symbols": [(lexer.has("low") ? {type: "low"} : low)], "postprocess": d => ({ type: 'PriceData', field: 'low' })},
    {"name": "price_data", "symbols": [(lexer.has("close") ? {type: "close"} : close)], "postprocess": d => ({ type: 'PriceData', field: 'close' })},
    {"name": "price_data", "symbols": [(lexer.has("volume") ? {type: "volume"} : volume)], "postprocess": d => ({ type: 'PriceData', field: 'volume' })},
    {"name": "technical_indicator", "symbols": [(lexer.has("sma") ? {type: "sma"} : sma), (lexer.has("lparen") ? {type: "lparen"} : lparen), "expression", (lexer.has("comma") ? {type: "comma"} : comma), "expression", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => buildFunctionCall('sma', [d[2], d[4]])},
    {"name": "technical_indicator", "symbols": [(lexer.has("ema") ? {type: "ema"} : ema), (lexer.has("lparen") ? {type: "lparen"} : lparen), "expression", (lexer.has("comma") ? {type: "comma"} : comma), "expression", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => buildFunctionCall('ema', [d[2], d[4]])},
    {"name": "technical_indicator", "symbols": [(lexer.has("rsi") ? {type: "rsi"} : rsi), (lexer.has("lparen") ? {type: "lparen"} : lparen), "expression", (lexer.has("comma") ? {type: "comma"} : comma), "expression", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => buildFunctionCall('rsi', [d[2], d[4]])},
    {"name": "technical_indicator", "symbols": [(lexer.has("macd") ? {type: "macd"} : macd), (lexer.has("lparen") ? {type: "lparen"} : lparen), "expression", (lexer.has("comma") ? {type: "comma"} : comma), "expression", (lexer.has("comma") ? {type: "comma"} : comma), "expression", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => buildFunctionCall('macd', [d[2], d[4], d[6]])},
    {"name": "technical_indicator", "symbols": [(lexer.has("bb") ? {type: "bb"} : bb), (lexer.has("lparen") ? {type: "lparen"} : lparen), "expression", (lexer.has("comma") ? {type: "comma"} : comma), "expression", (lexer.has("comma") ? {type: "comma"} : comma), "expression", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => buildFunctionCall('bb', [d[2], d[4], d[6]])},
    {"name": "technical_indicator", "symbols": [(lexer.has("stoch") ? {type: "stoch"} : stoch), (lexer.has("lparen") ? {type: "lparen"} : lparen), "expression", (lexer.has("comma") ? {type: "comma"} : comma), "expression", (lexer.has("comma") ? {type: "comma"} : comma), "expression", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => buildFunctionCall('stoch', [d[2], d[4], d[6]])},
    {"name": "technical_indicator", "symbols": [(lexer.has("atr") ? {type: "atr"} : atr), (lexer.has("lparen") ? {type: "lparen"} : lparen), "expression", (lexer.has("comma") ? {type: "comma"} : comma), "expression", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => buildFunctionCall('atr', [d[2], d[4]])},
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
