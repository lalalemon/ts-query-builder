/**
 * Simple test runner for ts-query-builder
 * No external dependencies required.
 */

import { QueryBuilder } from '../src/builder';

// ── Minimal test framework ────────────────────────────────────

let passed = 0;
let failed = 0;
const errors: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    failed++;
    const msg = `  ❌ ${name}: ${e.message}`;
    console.log(msg);
    errors.push(msg);
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected "${expected}" but got "${actual}"`);
      }
    },
    toContain(expected: string) {
      if (typeof actual !== 'string' || !actual.includes(expected)) {
        throw new Error(`Expected to contain "${expected}" but got "${actual}"`);
      }
    },
    toEqual(expected: unknown) {
      const a = JSON.stringify(actual);
      const e = JSON.stringify(expected);
      if (a !== e) {
        throw new Error(`Expected ${e} but got ${a}`);
      }
    },
    toHaveLength(expected: number) {
      if (!Array.isArray(actual) || actual.length !== expected) {
        throw new Error(`Expected length ${expected} but got ${(actual as any)?.length}`);
      }
    },
    toThrow() {
      if (typeof actual !== 'function') {
        throw new Error('Expected a function');
      }
      let threw = false;
      try {
        (actual as Function)();
      } catch {
        threw = true;
      }
      if (!threw) {
        throw new Error('Expected function to throw');
      }
    },
  };
}

// ── Tests ─────────────────────────────────────────────────────

console.log('\n🧪 ts-query-builder tests\n');

// SELECT basics
console.log('── SELECT ──');

test('select all columns', () => {
  const { sql } = QueryBuilder.create().select().from('users').build();
  expect(sql).toBe('SELECT * FROM users');
});

test('select specific columns', () => {
  const { sql } = QueryBuilder.create().select('id', 'name', 'email').from('users').build();
  expect(sql).toBe('SELECT id, name, email FROM users');
});

test('select distinct', () => {
  const { sql } = QueryBuilder.create().select('country').distinct().from('users').build();
  expect(sql).toBe('SELECT DISTINCT country FROM users');
});

test('select with alias', () => {
  const { sql } = QueryBuilder.create()
    .select({ column: 'u.name', alias: 'user_name' })
    .from('users', 'u')
    .build();
  expect(sql).toBe('SELECT u.name AS user_name FROM users AS u');
});

test('select with aggregate', () => {
  const { sql } = QueryBuilder.create()
    .select({ fn: 'COUNT', column: '*', alias: 'total' })
    .from('users')
    .build();
  expect(sql).toBe('SELECT COUNT(*) AS total FROM users');
});

// WHERE clauses
console.log('\n── WHERE ──');

test('where with implicit equals', () => {
  const { sql, params } = QueryBuilder.create()
    .select().from('users').where('name', 'Alice').build();
  expect(sql).toBe('SELECT * FROM users WHERE name = ?');
  expect(params).toEqual(['Alice']);
});

test('where with explicit operator', () => {
  const { sql, params } = QueryBuilder.create()
    .select().from('users').where('age', '>', 18).build();
  expect(sql).toBe('SELECT * FROM users WHERE age > ?');
  expect(params).toEqual([18]);
});

test('orWhere', () => {
  const { sql, params } = QueryBuilder.create()
    .select().from('users')
    .where('role', 'admin')
    .orWhere('role', 'superadmin')
    .build();
  expect(sql).toBe('SELECT * FROM users WHERE role = ? OR role = ?');
  expect(params).toEqual(['admin', 'superadmin']);
});

test('whereIn', () => {
  const { sql, params } = QueryBuilder.create()
    .select().from('users').whereIn('status', ['active', 'pending']).build();
  expect(sql).toBe('SELECT * FROM users WHERE status IN (?, ?)');
  expect(params).toEqual(['active', 'pending']);
});

test('whereBetween', () => {
  const { sql, params } = QueryBuilder.create()
    .select().from('orders').whereBetween('total', 10, 100).build();
  expect(sql).toBe('SELECT * FROM orders WHERE total BETWEEN ? AND ?');
  expect(params).toEqual([10, 100]);
});

test('whereNull', () => {
  const { sql } = QueryBuilder.create()
    .select().from('users').whereNull('deleted_at').build();
  expect(sql).toBe('SELECT * FROM users WHERE deleted_at IS NULL');
});

test('whereNotNull', () => {
  const { sql } = QueryBuilder.create()
    .select().from('users').whereNotNull('email').build();
  expect(sql).toBe('SELECT * FROM users WHERE email IS NOT NULL');
});

// JOINs
console.log('\n── JOIN ──');

test('inner join', () => {
  const { sql } = QueryBuilder.create()
    .select('u.name', 'o.total')
    .from('users', 'u')
    .join('orders', 'u.id = o.user_id')
    .build();
  expect(sql).toBe('SELECT u.name, o.total FROM users AS u INNER JOIN orders ON u.id = o.user_id');
});

test('left join', () => {
  const { sql } = QueryBuilder.create()
    .select().from('users')
    .leftJoin('profiles', 'users.id = profiles.user_id')
    .build();
  expect(sql).toBe('SELECT * FROM users LEFT JOIN profiles ON users.id = profiles.user_id');
});

test('multiple joins', () => {
  const { sql } = QueryBuilder.create()
    .select().from('orders')
    .join('users', 'orders.user_id = users.id')
    .leftJoin('products', 'orders.product_id = products.id')
    .build();
  expect(sql).toContain('INNER JOIN users');
  expect(sql).toContain('LEFT JOIN products');
});

// ORDER BY, LIMIT, OFFSET
console.log('\n── ORDER / LIMIT / OFFSET ──');

test('orderBy ascending', () => {
  const { sql } = QueryBuilder.create()
    .select().from('users').orderBy('name').build();
  expect(sql).toBe('SELECT * FROM users ORDER BY name ASC');
});

test('orderBy descending', () => {
  const { sql } = QueryBuilder.create()
    .select().from('users').orderBy('created_at', 'DESC').build();
  expect(sql).toBe('SELECT * FROM users ORDER BY created_at DESC');
});

test('multiple orderBy', () => {
  const { sql } = QueryBuilder.create()
    .select().from('users')
    .orderBy('role')
    .orderBy('name', 'DESC')
    .build();
  expect(sql).toBe('SELECT * FROM users ORDER BY role ASC, name DESC');
});

test('limit and offset', () => {
  const { sql, params } = QueryBuilder.create()
    .select().from('users').limit(10).offset(20).build();
  expect(sql).toBe('SELECT * FROM users LIMIT ? OFFSET ?');
  expect(params).toEqual([10, 20]);
});

// GROUP BY / HAVING
console.log('\n── GROUP BY / HAVING ──');

test('groupBy', () => {
  const { sql } = QueryBuilder.create()
    .select('department', { fn: 'COUNT', column: '*', alias: 'count' })
    .from('employees')
    .groupBy('department')
    .build();
  expect(sql).toBe('SELECT department, COUNT(*) AS count FROM employees GROUP BY department');
});

test('groupBy with having', () => {
  const { sql } = QueryBuilder.create()
    .select('department', { fn: 'COUNT', column: '*', alias: 'count' })
    .from('employees')
    .groupBy('department')
    .having('count', '>', 5)
    .build();
  expect(sql).toContain('GROUP BY department');
  expect(sql).toContain('HAVING count > ?');
});

// Complex queries
console.log('\n── COMPLEX ──');

test('full complex query', () => {
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

  expect(sql).toContain('SELECT u.name, u.email, COUNT(o.id) AS order_count');
  expect(sql).toContain('FROM users AS u');
  expect(sql).toContain('INNER JOIN orders');
  expect(sql).toContain('WHERE u.active = ? AND u.created_at > ?');
  expect(sql).toContain('GROUP BY u.id');
  expect(sql).toContain('HAVING order_count > ?');
  expect(sql).toContain('ORDER BY order_count DESC');
  expect(sql).toContain('LIMIT ?');
  expect(params).toEqual([true, '2024-01-01', 3, 10]);
});

// toSql (inline values)
console.log('\n── toSql ──');

test('toSql produces readable output', () => {
  const sql = QueryBuilder.create()
    .select('name').from('users').where('active', true).toSql();
  expect(sql).toBe("SELECT * FROM users WHERE active = TRUE");
});

test('toSql escapes strings', () => {
  const sql = QueryBuilder.create()
    .select().from('users').where("name", "O'Brien").toSql();
  expect(sql).toContain("O''Brien");
});

// Error handling
console.log('\n── ERRORS ──');

test('throws without from clause', () => {
  expect(() => QueryBuilder.create().select('id').build()).toThrow();
});

// Reset
console.log('\n── RESET ──');

test('reset clears the builder', () => {
  const qb = QueryBuilder.create().select('id').from('users').where('id', 1);
  qb.reset();
  const { sql } = qb.select().from('posts').build();
  expect(sql).toBe('SELECT * FROM posts');
});

// ── Summary ───────────────────────────────────────────────────

console.log(`\n${'═'.repeat(50)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (errors.length > 0) {
  console.log(`\n  Failures:`);
  errors.forEach((e) => console.log(e));
}
console.log(`${'═'.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
