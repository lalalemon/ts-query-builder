export { QueryBuilder } from './builder';
export type {
  Query,
  WhereClause,
  OrderByClause,
  SortDirection,
  ComparisonOperator,
  JoinType,
  JoinClause,
  AggregateFunction,
  AggregateColumn,
  SelectColumn,
} from './types';

// Convenience factory
import { QueryBuilder } from './builder';

/** Create a new query builder instance */
export function createQuery(): QueryBuilder {
  return new QueryBuilder();
}
