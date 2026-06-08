/**
 * Type definitions for ts-query-builder
 */

/** Supported SQL comparison operators */
export type ComparisonOperator =
  | '='
  | '!='
  | '<>'
  | '>'
  | '>='
  | '<'
  | '<='
  | 'LIKE'
  | 'NOT LIKE'
  | 'ILIKE'
  | 'IN'
  | 'NOT IN'
  | 'IS NULL'
  | 'IS NOT NULL'
  | 'BETWEEN';

/** Sort direction */
export type SortDirection = 'ASC' | 'DESC';

/** A single WHERE condition */
export interface WhereClause {
  column: string;
  operator: ComparisonOperator;
  value: unknown;
  /** Logical connector to previous clause */
  connector: 'AND' | 'OR';
}

/** An ORDER BY clause */
export interface OrderByClause {
  column: string;
  direction: SortDirection;
}

/** JOIN types */
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';

/** A JOIN clause */
export interface JoinClause {
  type: JoinType;
  table: string;
  on: string;
}

/** Aggregate functions */
export type AggregateFunction = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';

/** An aggregate column */
export interface AggregateColumn {
  fn: AggregateFunction;
  column: string;
  alias?: string;
}

/** A column in SELECT with optional alias */
export interface SelectColumn {
  column: string;
  alias?: string;
}

/** Complete query representation */
export interface Query {
  select: (string | SelectColumn | AggregateColumn)[];
  from: string;
  fromAlias?: string;
  joins: JoinClause[];
  wheres: WhereClause[];
  orderBys: OrderByClause[];
  groupBys: string[];
  having: WhereClause[];
  limit?: number;
  offset?: number;
  distinct: boolean;
}
