# ts-query-builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)]()

A type-safe SQL query builder for TypeScript with zero runtime dependencies. Build complex SQL queries using a fluent API with full type inference.

## Features

- 🔒 **Type-safe** — Full TypeScript support with type inference
- 🪶 **Zero dependencies** — No runtime dependencies at all
- 🧩 **Fluent API** — Chain methods for readable query construction
- 🔍 **Parameterized queries** — Automatic parameter binding to prevent SQL injection
- 📐 **Comprehensive** — SELECT, WHERE, JOIN, GROUP BY, HAVING, ORDER BY, LIMIT/OFFSET

## Installation

```bash
npm install ts-query-builder
```

## Quick Start

```typescript
import { QueryBuilder } from 'ts-query-builder';

const { sql, params } = QueryBuilder.create()
  .select('u.name', 'u.email', { fn: 'COUNT', column: 'o.id', alias: 'order_count' })
  .from('users', 'u')
  .join('orders', 'u.id = o.user_id')
  .where('u.active', true)
  .where('u.created_at', '>', '2024-01-01')
  .groupBy('u.id')
  .having('order_count', '>', 3)
  .orderBy('order_count', 'DESC')
  .limit(10)
  .build();

console.log(sql);
// SELECT u.name, u.email, COUNT(o.id) AS order_count
// FROM users AS u
// INNER JOIN orders ON u.id = o.user_id
// WHERE u.active = ? AND u.created_at > ?
// GROUP BY u.id
// HAVING order_count > ?
// ORDER BY order_count DESC
// LIMIT ?

console.log(params);
// [true, '2024-01-01', 3, 10]
```

## API Reference

### `QueryBuilder.create()`

Creates a new query builder instance.

### Select

```typescript
.select()                           // SELECT *
.select('id', 'name')               // SELECT id, name
.select({ column: 'u.name', alias: 'user_name' })  // SELECT u.name AS user_name
.select({ fn: 'COUNT', column: '*', alias: 'total' })  // SELECT COUNT(*) AS total
.distinct()                         // SELECT DISTINCT
```

### From

```typescript
.from('users')                      // FROM users
.from('users', 'u')                 // FROM users AS u
```

### Where

```typescript
.where('name', 'Alice')             // WHERE name = ?
.where('age', '>', 18)              // WHERE age > ?
.orWhere('role', 'admin')           // OR role = ?
.whereIn('status', ['active', 'pending'])   // WHERE status IN (?, ?)
.whereBetween('price', 10, 100)     // WHERE price BETWEEN ? AND ?
.whereNull('deleted_at')            // WHERE deleted_at IS NULL
.whereNotNull('email')              // WHERE email IS NOT NULL
```

### Join

```typescript
.join('orders', 'users.id = orders.user_id')              // INNER JOIN
.leftJoin('profiles', 'users.id = profiles.user_id')       // LEFT JOIN
.rightJoin('departments', 'users.dept_id = departments.id') // RIGHT JOIN
```

### Order, Group, Limit

```typescript
.orderBy('name')                    // ORDER BY name ASC
.orderBy('created_at', 'DESC')      // ORDER BY created_at DESC
.groupBy('department')              // GROUP BY department
.having('count', '>', 5)           // HAVING count > ?
.limit(10)                          // LIMIT ?
.offset(20)                         // OFFSET ?
```

### Build

```typescript
const { sql, params } = qb.build();  // Parameterized query
const readable = qb.toSql();         // Inline values (for debugging)
qb.reset();                          // Clear and start fresh
```

## Supported Operators

| Operator | Example |
|----------|---------|
| `=` | `.where('name', 'Alice')` |
| `!=`, `<>` | `.where('name', '!=', 'Alice')` |
| `>`, `>=`, `<`, `<=` | `.where('age', '>', 18)` |
| `LIKE`, `NOT LIKE` | `.where('name', 'LIKE', '%ali%')` |
| `ILIKE` | `.where('name', 'ILIKE', '%ali%')` |
| `IN`, `NOT IN` | `.whereIn('id', [1, 2, 3])` |
| `IS NULL` | `.whereNull('deleted_at')` |
| `IS NOT NULL` | `.whereNotNull('email')` |
| `BETWEEN` | `.whereBetween('price', 10, 100)` |

## Running Tests

```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
