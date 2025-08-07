# Simplified Pine Script-like DSL Grammar for QuantFlow
@{%
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
%}

@lexer lexer

# Main expression
main -> expression {% id %}

# Expressions with precedence
expression -> logical_or {% id %}

logical_or -> logical_and (%or logical_and):* {% d => d[1].reduce((acc, curr) => buildBinaryOp(acc, 'or', curr[1]), d[0]) %}

logical_and -> equality (%and equality):* {% d => d[1].reduce((acc, curr) => buildBinaryOp(acc, 'and', curr[1]), d[0]) %}

equality -> comparison ((%eq | %ne) comparison):* {% d => d[1].reduce((acc, curr) => buildBinaryOp(acc, curr[0][0].value, curr[1]), d[0]) %}

comparison -> additive ((%gt | %gte | %lt | %lte) additive):* {% d => d[1].reduce((acc, curr) => buildBinaryOp(acc, curr[0][0].value, curr[1]), d[0]) %}

additive -> multiplicative ((%plus | %minus) multiplicative):* {% d => d[1].reduce((acc, curr) => buildBinaryOp(acc, curr[0][0].value, curr[1]), d[0]) %}

multiplicative -> power ((%multiply | %divide | %modulo) power):* {% d => d[1].reduce((acc, curr) => buildBinaryOp(acc, curr[0][0].value, curr[1]), d[0]) %}

power -> unary (%power unary):* {% d => d[1].reduce((acc, curr) => buildBinaryOp(acc, '^', curr[1]), d[0]) %}

unary -> %not unary {% d => buildUnaryOp('not', d[1]) %}
       | %minus unary {% d => buildUnaryOp('-', d[1]) %}
       | primary {% id %}

primary -> %number {% d => ({ type: 'Number', value: parseFloat(d[0].value) }) %}
         | %string {% d => ({ type: 'String', value: d[0].value.slice(1, -1) }) %}
         | function_call {% id %}
         | %identifier {% d => ({ type: 'Identifier', name: d[0].value }) %}
         | price_data {% id %}
         | %lparen expression %rparen {% d => d[1] %}

# Function calls
function_call -> %identifier %lparen argument_list %rparen {% d => buildFunctionCall(d[0].value, d[2]) %}

# Price data references
price_data -> %open {% d => ({ type: 'PriceData', field: 'open' }) %}
           | %high {% d => ({ type: 'PriceData', field: 'high' }) %}
           | %low {% d => ({ type: 'PriceData', field: 'low' }) %}
           | %close {% d => ({ type: 'PriceData', field: 'close' }) %}
           | %volume {% d => ({ type: 'PriceData', field: 'volume' }) %}

# Argument list for functions
argument_list -> expression (%comma expression):* {% d => [d[0]].concat(d[1].map(item => item[1])) %}
              | null {% () => [] %}
