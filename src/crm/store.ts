import { useSyncExternalStore } from 'react';
import { createSeed } from './seed.ts';
import { createEvent, insertOrder, parseDatabase, phoneDigits, setOrderStatus, validateClient, validateOrder, type Client, type Database, type OrderInput, type Status } from './model.ts';

export const STORAGE_KEY = 'kontakt:crm:v1';
type Snapshot = { data: Database; error: string };
let snapshot: Snapshot | null = null;
const subscribers = new Set<() => void>();
function load(): Snapshot {
  try { return { data: parseDatabase(localStorage.getItem(STORAGE_KEY)) ?? createSeed(), error: '' }; }
  catch { return { data: createSeed(), error: 'Хранилище браузера недоступно. Изменения сохранятся только до закрытия страницы.' }; }
}
function getSnapshot() { return snapshot ??= load(); }
// The public intake form also writes to this store without mounting useCRM.
// Listen for other tabs there too, so a later submission keeps their edits.
window.addEventListener('storage', (event: StorageEvent) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  snapshot = load(); subscribers.forEach(listener => listener());
});
function subscribe(fn: () => void) {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}
function commit(data: Database) {
  let error = '';
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { error = 'Не удалось сохранить изменения в браузере. Не закрывайте страницу.'; }
  snapshot = { data, error };
  subscribers.forEach(fn => fn());
  return !error;
}
export function useCRM() { return useSyncExternalStore(subscribe, getSnapshot, getSnapshot); }
export function addOrder(input: OrderInput, source: 'site' | 'manual' = 'manual') {
  const result = insertOrder(getSnapshot().data, input, source);
  return { order: result.order, saved: commit(result.db) };
}
export function changeStatus(id: string, status: Status) { return commit(setOrderStatus(getSnapshot().data, id, status)); }
export function editOrder(id: string, input: OrderInput) {
  if (Object.keys(validateOrder(input)).length) throw new Error('Проверьте поля заявки.');
  const db = getSnapshot().data;
  return commit({ ...db, orders: db.orders.map(order => order.id !== id ? order : {
    ...order, model: input.model.trim(), device: input.device, problem: input.problem.trim(), masterId: input.masterId,
    due: input.due, amount: input.amount, priority: input.priority, updatedAt: new Date().toISOString(),
    history: [...order.history, createEvent('Данные ремонта обновлены', 'edit')],
  }) });
}
export function addNote(id: string, text: string) {
  const note = text.trim().slice(0, 1000);
  if (!note) return false;
  const db = getSnapshot().data;
  return commit({ ...db, orders: db.orders.map(o => o.id !== id ? o : { ...o, updatedAt: new Date().toISOString(), history: [...o.history, createEvent(note, 'note')] }) });
}
export function saveClient(input: Pick<Client, 'name' | 'phone' | 'note'>, id?: string) {
  if (Object.keys(validateClient(input.name, input.phone)).length) throw new Error('Проверьте имя и телефон.');
  const db = getSnapshot().data;
  if (db.clients.some(c => c.id !== id && phoneDigits(c.phone) === phoneDigits(input.phone))) throw new Error('Клиент с этим телефоном уже есть в базе.');
  const client: Client = { id: id ?? crypto.randomUUID(), name: input.name.trim(), phone: '+' + phoneDigits(input.phone), note: input.note.trim(), createdAt: db.clients.find(c => c.id === id)?.createdAt ?? new Date().toISOString() };
  const clients = id ? db.clients.map(c => c.id === id ? client : c) : [client, ...db.clients];
  commit({ ...db, clients });
  return client;
}
export function resetData() { return commit(createSeed()); }
