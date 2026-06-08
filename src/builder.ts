import {
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

export class QueryBuilder {
  private query: Query = {
    select: [],
    from: '',
    joins: [],
    wheres: [],
    orderBys: [],
    groupBys: [],
    having: [],
    distinct: false,
  };

  /**
   * Create a new QueryBuilder instance
   */
  static create(): QueryBuilder {
    return new QueryBuilder();
  }

  /**
   * Set SELECT columns. Pass '*' or specific columns.
   * Supports aliases: select('u.name', 'name')
   * Supports aggregates: select({ fn: 'COUNT', column: '*', alias: 'total' })
   */
  select(
    ...columns: (string | SelectColumn | AggregateColumn)[]
  ): this {
    if (columns.length === 0) {
      this.query.select = ['*'];
    } else {
      this.query.select = columns;
    }
    return this;
  }

  /**
   * Enable SELECT DISTINCT
   */
  distinct(): this {
    this.query.distinct = true;
    return this;
  }

  /**
   * Set the FROM table
   */
  from(table: string, alias?: string): this {
    this.query.from = table;
    this.query.fromAlias = alias;
    return this;
  }

  /**
   * Add a WHERE condition
   */
  where(column: string, operatorOrValue?: ComparisonOperator | unknown, value?: unknown): this {
    let operator: ComparisonOperator;
    let actualValue: unknown;

    if (value !== undefined) {
      // where('age', '>', 18)
      operator = operatorOrValue as ComparisonOperator;
      actualValue = value;
    } else if (operatorOrValue !== undefined) {
      // where('name', 'John') → implicit '='
      operator = '=';
      actualValue = operatorOrValue;
    } else {
      // where('deleted_at') → IS NULL
      operator = 'IS NULL';
      actualValue = null;
    }

    this.query.wheres.push({
      column,
      operator,
      value: actualValue,
      connector: 'AND',
    });

    return this;
  }

  /**
   * Add an OR WHERE condition
   */
  orWhere(column: string, operatorOrValue?: ComparisonOperator | unknown, value?: unknown): this {
    let operator: ComparisonOperator;
    let actualValue: unknown;

    if (value !== undefined) {
      operator = operatorOrValue as ComparisonOperator;
      actualValue = value;
    } else if (operatorOrValue !== undefined) {
      operator = '=';
      actualValue = operatorOrValue;
    } else {
      operator = 'IS NULL';
      actualValue = null;
    }

    this.query.wheres.push({
      column,
      operator,
      value: actualValue,
      connector: 'OR',
    });

    return this;
  }

  /**
   * Add WHERE IN clause
   */
  whereIn(column: string, values: unknown[]): this {
    this.query.wheres.push({
      column,
      operator: 'IN',
      value: values,
      connector: 'AND',
    });
    return this;
  }

  /**
   * Add WHERE BETWEEN clause
   */
  whereBetween(column: string, low: unknown, high: unknown): this {
    this.query.wheres.push({
      column,
      operator: 'BETWEEN',
      value: [low, high],
      connector: 'AND',
    });
    return this;
  }

  /**
   * Add WHERE NULL clause
   */
  whereNull(column: string): this {
    this.query.wheres.push({
      column,
      operator: 'IS NULL',
      value: null,
      connector: 'AND',
    });
    return this;
  }

  /**
   * Add WHERE NOT NULL clause
   */
  whereNotNull(column: string): this {
    this.query.wheres.push({
      column,
      operator: 'IS NOT NULL',
      value: null,
      connector: 'AND',
    });
    return this;
  }

  /**
   * Add a JOIN clause
   */
  join(table: string, on: string, type: JoinType = 'INNER'): this {
    this.query.joins.push({ type, table, on });
    return this;
  }

  /**
   * Add a LEFT JOIN
   */
  leftJoin(table: string, on: string): this {
    return this.join(table, on, 'LEFT');
  }

  /**
   * Add a RIGHT JOIN
   */
  rightJoin(table: string, on: string): this {
    return this.join(table, on, 'RIGHT');
  }

  /**
   * Add ORDER BY clause(s)
   */
  orderBy(column: string, direction: SortDirection = 'ASC'): this {
    this.query.orderBys.push({ column, direction });
    return this;
  }

  /**
   * Add GROUP BY clause
   */
  groupBy(...columns: string[]): this {
    this.query.groupBys.push(...columns);
    return this;
  }

  /**
   * Add HAVING condition (used with GROUP BY)
   */
  having(
    column: string,
    operatorOrValue?: ComparisonOperator | unknown,
    value?: unknown
  ): this {
    let operator: ComparisonOperator;
    let actualValue: unknown;

    if (value !== undefined) {
      operator = operatorOrValue as ComparisonOperator;
      actualValue = value;
    } else if (operatorOrValue !== undefined) {
      operator = '=';
      actualValue = operatorOrValue;
    } else {
      operator = 'IS NULL';
      actualValue = null;
    }

    this.query.having.push({
      column,
      operator,
      value: actualValue,
      connector: 'AND',
    });

    return this;
  }

  /**
   * Set LIMIT
   */
  limit(count: number): this {
    this.query.limit = count;
    return this;
  }

  /**
   * Set OFFSET
   */
  offset(count: number): this {
    this.query.offset = count;
    return this;
  }

  /**
   * Build the final SQL query string with parameterized values
   */
  build(): { sql: string; params: unknown[] } {
    const params: unknown[] = [];
    const parts: string[] = [];

    // SELECT
    if (this.query.select.length === 0) {
      parts.push('SELECT *');
    } else {
      const selectKeyword = this.query.distinct ? 'SELECT DISTINCT' : 'SELECT';
      const selectParts = this.query.select.map((col) => {
        if (typeof col === 'string') {
          return col;
        }
        const c = col as SelectColumn | AggregateColumn;
        if ('fn' in c) {
          const agg = c as AggregateColumn;
          const expr = `${agg.fn}(${agg.column})`;
          return agg.alias ? `${expr} AS ${agg.alias}` : expr;
        }
        const sc = c as SelectColumn;
        return sc.alias ? `${sc.column} AS ${sc.alias}` : sc.column;
      });
      parts.push(`${selectKeyword} ${selectParts.join(', ')}`);
    }

    // FROM
    if (!this.query.from) {
      throw new Error('FROM clause is required. Call .from(table) before building.');
    }
    const fromClause = this.query.fromAlias
      ? `${this.query.from} AS ${this.query.fromAlias}`
      : this.query.from;
    parts.push(`FROM ${fromClause}`);

    // JOINs
    for (const j of this.query.joins) {
      parts.push(`${j.type} JOIN ${j.table} ON ${j.on}`);
    }

    // WHERE
    if (this.query.wheres.length > 0) {
      parts.push(`WHERE ${this.buildWhereClauses(this.query.wheres, params)}`);
    }

    // GROUP BY
    if (this.query.groupBys.length > 0) {
      parts.push(`GROUP BY ${this.query.groupBys.join(', ')}`);
    }

    // HAVING
    if (this.query.having.length > 0) {
      parts.push(`HAVING ${this.buildWhereClauses(this.query.having, params)}`);
    }

    // ORDER BY
    if (this.query.orderBys.length > 0) {
      const orderParts = this.query.orderBys.map(
        (o) => `${o.column} ${o.direction}`
      );
      parts.push(`ORDER BY ${orderParts.join(', ')}`);
    }

    // LIMIT
    if (this.query.limit !== undefined) {
      params.push(this.query.limit);
      parts.push(`LIMIT ?`);
    }

    // OFFSET
    if (this.query.offset !== undefined) {
      params.push(this.query.offset);
      parts.push(`OFFSET ?`);
    }

    return {
      sql: parts.join(' '),
      params,
    };
  }

  /**
   * Build the SQL string with inline values (for debugging / display)
   */
  toSql(): string {
    const { sql, params } = this.build();
    let result = sql;
    for (const param of params) {
      result = result.replace('?', this.formatValue(param));
    }
    return result;
  }

  /**
   * Reset the builder to start a new query
   */
  reset(): this {
    this.query = {
      select: [],
      from: '',
      joins: [],
      wheres: [],
      orderBys: [],
      groupBys: [],
      having: [],
      distinct: false,
    };
    return this;
  }

  // ── Private helpers ──────────────────────────────────────────

  private buildWhereClauses(clauses: WhereClause[], params: unknown[]): string {
    return clauses
      .map((clause, index) => {
        const prefix = index === 0 ? '' : ` ${clause.connector} `;
        return `${prefix}${this.buildSingleWhere(clause, params)}`;
      })
      .join('');
  }

  private buildSingleWhere(clause: WhereClause, params: unknown[]): string {
    const { column, operator, value } = clause;

    switch (operator) {
      case 'IS NULL':
      case 'IS NOT NULL':
        return `${column} ${operator}`;

      case 'IN':
      case 'NOT IN': {
        const vals = value as unknown[];
        const placeholders = vals.map(() => '?').join(', ');
        params.push(...vals);
        return `${column} ${operator} (${placeholders})`;
      }

      case 'BETWEEN': {
        const [low, high] = value as [unknown, unknown];
        params.push(low, high);
        return `${column} BETWEEN ? AND ?`;
      }

      default:
        params.push(value);
        return `${column} ${operator} ?`;
    }
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return String(value);
  }
}
