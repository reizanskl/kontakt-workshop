import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../src/crm/seed.ts';
import { csvCell, insertOrder, orderMatches, parseDatabase, setOrderStatus, validateOrder, type OrderInput } from '../src/crm/model.ts';
const input: OrderInput = { name: 'Виктор Тестов', phone: '+7 (900) 999-99-99', device: 'laptop', model: 'ASUS Zenbook', problem: 'Перегревается под нагрузкой', status: 'new', priority: 'urgent', amount: 4500, masterId: 'ilya', due: '2026-10-25' };

test('new order creates a linked client, unique number and intake history', () => {
  const db = createSeed(); const first = insertOrder(db, input, 'site'); const second = insertOrder(first.db, { ...input, model: 'iPhone 15', device: 'phone' });
  assert.equal(first.db.clients.length, db.clients.length + 1);
  assert.equal(first.order.source, 'site'); assert.match(first.order.history[0].text, /с сайта/);
  assert.equal(second.db.clients.length, first.db.clients.length);
  assert.equal(second.order.clientId, first.order.clientId); assert.notEqual(first.order.id, second.order.id);
  assert.equal(db.orders.length, 12);
});
test('Russian telephone formats identify the same client', () => {
  const db = createSeed(); const result = insertOrder(db, { ...input, phone: '8 (900) 000-10-01' });
  assert.equal(result.order.clientId, 'client-1'); assert.equal(result.db.clients.length, db.clients.length);
});
test('status transitions preserve order and client, and add one history event', () => {
  let db = createSeed(); const old = db.orders.find(o => o.id === 'КТ-1024')!;
  for (const status of ['diagnosis', 'repair', 'ready', 'issued'] as const) db = setOrderStatus(db, old.id, status);
  const done = db.orders.find(o => o.id === old.id)!;
  assert.equal(done.status, 'issued'); assert.equal(done.clientId, old.clientId);
  assert.equal(done.history.length, old.history.length + 4); assert.equal(db.orders.length, 12);
  const same = setOrderStatus(db, old.id, 'issued').orders.find(o => o.id === old.id)!;
  assert.equal(same.history.length, done.history.length);
});
test('editing an archived status can return a repair to the working board', () => {
  const db = createSeed(); const next = setOrderStatus(db, 'КТ-1015', 'repair');
  assert.equal(next.orders.find(o => o.id === 'КТ-1015')?.status, 'repair');
  assert.equal(db.orders.find(o => o.id === 'КТ-1015')?.status, 'issued');
});
test('form rejects missing contacts, invalid amounts and impossible dates', () => {
  const errors = validateOrder({ ...input, name: '', phone: 'abc', model: '', problem: 'bad', amount: -1, due: '2026-02-31' });
  for (const key of ['name', 'phone', 'model', 'problem', 'amount', 'due']) assert.ok(errors[key]);
  assert.deepEqual(validateOrder(input), {});
});
test('local storage schema validates references and corrupted values', () => {
  const db = createSeed(); assert.equal(parseDatabase(JSON.stringify(db))?.orders.length, 12);
  assert.equal(parseDatabase('{bad'), null); assert.equal(parseDatabase(null), null);
  assert.equal(parseDatabase(JSON.stringify({ ...db, version: 2 })), null);
  assert.equal(parseDatabase(JSON.stringify({ ...db, clients: [] })), null);
  assert.equal(parseDatabase(JSON.stringify({ ...db, orders: [{ ...db.orders[0], amount: 'oops' }] })), null);
});
test('search matches client, order number, phone digits and device', () => {
  const db = createSeed(); const o = db.orders[0]; const c = db.clients[0];
  for (const term of ['анна', 'КТ-1024', 'iphone', '0001001']) assert.equal(orderMatches(o, c, term), true);
  assert.equal(orderMatches(o, c, 'несуществующее'), false);
});
test('CSV escapes quotes and neutralizes spreadsheet formula prefixes', () => {
  assert.equal(csvCell('обычный "текст"'), '"обычный ""текст"""');
  assert.equal(csvCell('=1+1'), '"\'=1+1"');
  assert.equal(csvCell('+79000000000'), '"\'+79000000000"');
});
