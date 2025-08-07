# Pine Script-like DSL Grammar for QuantFlow
@{%
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
%}

@lexer lexer

# Main program
main -> statements {% id %}

statements -> statement:* {% d => d[0].filter(s => s !== null) %}

statement -> assignment %newline:? {% id %}
           | expression %newline:? {% id %}
           | strategy %newline:? {% id %}
           | conditional %newline:? {% id %}
           | %newline {% () => null %}

# Assignments
assignment -> %identifier %assign expression {% d => buildAssignment(d[0].value, d[2]) %}

# Strategy definition
strategy -> %strategy %lparen %string %rparen %newline:? strategy_rules {% d => buildStrategy(d[2].value.slice(1, -1), d[5]) %}

strategy_rules -> strategy_rule:* {% id %}

strategy_rule -> buy_condition %newline:? {% id %}
               | sell_condition %newline:? {% id %}

buy_condition -> %if expression %then %buy {% d => ({ type: 'BuyCondition', condition: d[1] }) %}
sell_condition -> %if expression %then %sell {% d => ({ type: 'SellCondition', condition: d[1] }) %}

# Conditionals
conditional -> %if expression %then expression (%else expression):? {% d => buildConditional(d[1], d[3], d[4] ? d[4][1] : null) %}

# Expressions
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
       | postfix {% id %}

postfix -> primary (%lbracket expression %rbracket):* {% d => d[1].reduce((acc, curr) => ({ type: 'IndexAccess', object: acc, index: curr[1] }), d[0]) %}

primary -> %number {% d => ({ type: 'Number', value: parseFloat(d[0].value) }) %}
         | %string {% d => ({ type: 'String', value: d[0].value.slice(1, -1) }) %}
         | %identifier %lparen argument_list %rparen {% d => buildFunctionCall(d[0].value, d[2]) %}
         | %identifier {% d => ({ type: 'Identifier', name: d[0].value }) %}
         | price_data {% id %}
         | technical_indicator {% id %}
         | %lparen expression %rparen {% d => d[1] %}

# Price data references
price_data -> %open {% d => ({ type: 'PriceData', field: 'open' }) %}
           | %high {% d => ({ type: 'PriceData', field: 'high' }) %}
           | %low {% d => ({ type: 'PriceData', field: 'low' }) %}
           | %close {% d => ({ type: 'PriceData', field: 'close' }) %}
           | %volume {% d => ({ type: 'PriceData', field: 'volume' }) %}

# Technical indicators
technical_indicator -> %sma %lparen expression %comma expression %rparen {% d => buildFunctionCall('sma', [d[2], d[4]]) %}
                    | %ema %lparen expression %comma expression %rparen {% d => buildFunctionCall('ema', [d[2], d[4]]) %}
                    | %rsi %lparen expression %comma expression %rparen {% d => buildFunctionCall('rsi', [d[2], d[4]]) %}
                    | %macd %lparen expression %comma expression %comma expression %rparen {% d => buildFunctionCall('macd', [d[2], d[4], d[6]]) %}
                    | %bb %lparen expression %comma expression %comma expression %rparen {% d => buildFunctionCall('bb', [d[2], d[4], d[6]]) %}
                    | %stoch %lparen expression %comma expression %comma expression %rparen {% d => buildFunctionCall('stoch', [d[2], d[4], d[6]]) %}
                    | %atr %lparen expression %comma expression %rparen {% d => buildFunctionCall('atr', [d[2], d[4]]) %}

argument_list -> expression (%comma expression):* {% d => [d[0]].concat(d[1].map(item => item[1])) %}
              | null {% () => [] %}
