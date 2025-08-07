/**
 * Abstract Syntax Tree node definitions for Pine-like DSL
 */

export interface ASTNode {
  type: string;
}

export interface NumberNode extends ASTNode {
  type: 'Number';
  value: number;
}

export interface StringNode extends ASTNode {
  type: 'String';
  value: string;
}

export interface IdentifierNode extends ASTNode {
  type: 'Identifier';
  name: string;
}

export interface PriceDataNode extends ASTNode {
  type: 'PriceData';
  field: 'open' | 'high' | 'low' | 'close' | 'volume';
}

export interface BinaryOperationNode extends ASTNode {
  type: 'BinaryOperation';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOperationNode extends ASTNode {
  type: 'UnaryOperation';
  operator: string;
  operand: ASTNode;
}

export interface FunctionCallNode extends ASTNode {
  type: 'FunctionCall';
  name: string;
  arguments: ASTNode[];
}

export interface AssignmentNode extends ASTNode {
  type: 'Assignment';
  identifier: string;
  expression: ASTNode;
}

export interface ConditionalNode extends ASTNode {
  type: 'Conditional';
  condition: ASTNode;
  then: ASTNode;
  else?: ASTNode;
}

export interface BuyConditionNode extends ASTNode {
  type: 'BuyCondition';
  condition: ASTNode;
}

export interface SellConditionNode extends ASTNode {
  type: 'SellCondition';
  condition: ASTNode;
}

export interface StrategyNode extends ASTNode {
  type: 'Strategy';
  name: string;
  rules: (BuyConditionNode | SellConditionNode)[];
}

export interface IndexAccessNode extends ASTNode {
  type: 'IndexAccess';
  object: ASTNode;
  index: ASTNode;
}

export type AST = ASTNode | ASTNode[];
