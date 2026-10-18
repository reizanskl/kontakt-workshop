export const statuses = ['new', 'diagnosis', 'repair', 'ready', 'issued'] as const;
export type Status = typeof statuses[number];
export type DeviceKind = 'phone' | 'laptop' | 'tablet' | 'other';
export type Priority = 'normal' | 'urgent';
export type Client = { id: string; name: string; phone: string; note: string; createdAt: string };
export type Event = { id: string; text: string; at: string; kind: 'created' | 'status' | 'note' | 'edit' };
export type Order = {
  id: string; clientId: string; model: string; device: DeviceKind; problem: string;
  status: Status; priority: Priority; masterId: string; amount: number; due: string;
  source: 'site' | 'manual'; createdAt: string; updatedAt: string; history: Event[];
};
export type Database = { version: 1; clients: Client[]; orders: Order[] };
export type OrderInput = {
  clientId?: string; name: string; phone: string; model: string; device: DeviceKind;
  problem: string; status: Status; priority: Priority; masterId: string; amount: number; due: string;
};
export const statusLabels: Record<Status, string> = { new: 'Новая', diagnosis: 'Диагностика', repair: 'В ремонте', ready: 'Готова', issued: 'Выдана' };
export const columnLabels: Record<Status, string> = { new: 'Новые', diagnosis: 'Диагностика', repair: 'В ремонте', ready: 'Готовы', issued: 'Выданы' };
export const deviceLabels: Record<DeviceKind, string> = { phone: 'Смартфон', laptop: 'Ноутбук', tablet: 'Планшет', other: 'Другое' };
export const masters = [
  { id: 'ilya', name: 'Илья Лебедев', initials: 'ИЛ' },
  { id: 'andrey', name: 'Андрей Павлов', initials: 'АП' },
  { id: 'sofia', name: 'Софья Никитина', initials: 'СН' },
  { id: 'maxim', name: 'Максим Кузнецов', initials: 'МК' },
];
export const money = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽';
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
export const phoneDigits = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11 && digits[0] === '8' ? '7' + digits.slice(1) : digits;
};
export function displayPhone(phone: string) {
  const n = phoneDigits(phone);
  return n.length === 11 && n[0] === '7' ? `+7 (${n.slice(1, 4)}) ${n.slice(4, 7)}-${n.slice(7, 9)}-${n.slice(9)}` : phone;
}
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dayOffset(days: number, from = new Date()) {
  const date = new Date(from); date.setDate(date.getDate() + days); return localDay(date);
}
export function dateLabel(value: string, short = false) {
  const date = new Date(value.length === 10 ? value + 'T12:00:00' : value);
  return Number.isNaN(date.valueOf()) ? 'Не указан' : new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: short ? 'short' : 'long' }).format(date);
}
export function dueLabel(due: string, status: Status) {
  if (status === 'ready') return 'Готов к выдаче';
  if (status === 'issued') return 'Выдан клиенту';
  if (due === localDay()) return 'Сегодня';
  if (due === dayOffset(1)) return 'Завтра';
  return dateLabel(due, true);
}
export const isOverdue = (order: Order) => order.status !== 'issued' && order.status !== 'ready' && order.due < localDay();
export const createEvent = (text: string, kind: Event['kind'], at = new Date().toISOString()): Event => ({ id: crypto.randomUUID(), text, kind, at });

export function validateClient(name: string, phone: string) {
  const errors: Record<string, string> = {};
  if (name.trim().length < 2 || name.trim().length > 60) errors.name = 'Укажите имя: от 2 до 60 символов.';
  const digits = phoneDigits(phone);
  if (digits.length < 10 || digits.length > 15 || !/^[+\d\s().-]+$/.test(phone.trim())) errors.phone = 'Укажите телефон: от 10 до 15 цифр.';
  return errors;
}
export function validateOrder(input: OrderInput) {
  const errors = validateClient(input.name, input.phone);
  if (!input.model.trim() || input.model.trim().length > 100) errors.model = 'Укажите модель устройства.';
  if (input.problem.trim().length < 5 || input.problem.trim().length > 1000) errors.problem = 'Опишите неисправность: от 5 до 1000 символов.';
  if (!Number.isFinite(input.amount) || input.amount < 0 || input.amount > 10000000) errors.amount = 'Стоимость должна быть от 0 до 10 000 000 ₽.';
  const parsedDue = new Date(input.due + 'T12:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.due) || Number.isNaN(parsedDue.valueOf()) || parsedDue.toISOString().slice(0, 10) !== input.due) errors.due = 'Укажите существующую дату ремонта.';
  if (!Object.hasOwn(deviceLabels, input.device)) errors.device = 'Выберите устройство.';
  if (!statuses.includes(input.status)) errors.status = 'Выберите этап ремонта.';
  if (!['normal', 'urgent'].includes(input.priority)) errors.priority = 'Выберите приоритет.';
  if (input.masterId && !masters.some(m => m.id === input.masterId)) errors.masterId = 'Выберите мастера из списка.';
  return errors;
}

export function insertOrder(db: Database, input: OrderInput, source: Order['source'] = 'manual'): { db: Database; order: Order } {
  if (Object.keys(validateOrder(input)).length) throw new Error('Проверьте поля заявки.');
  const at = new Date().toISOString();
  let client = input.clientId ? db.clients.find(c => c.id === input.clientId) : db.clients.find(c => phoneDigits(c.phone) === phoneDigits(input.phone));
  const clients = [...db.clients];
  if (!client) {
    client = { id: crypto.randomUUID(), name: input.name.trim(), phone: '+' + phoneDigits(input.phone), note: '', createdAt: at };
    clients.push(client);
  }
  const nextId = Math.max(1000, ...db.orders.map(o => Number(o.id.replace('КТ-', '')) || 1000)) + 1;
  const order: Order = {
    id: `КТ-${nextId}`, clientId: client.id, model: input.model.trim(), device: input.device,
    problem: input.problem.trim(), status: input.status, priority: input.priority, masterId: input.masterId,
    amount: input.amount, due: input.due, source, createdAt: at, updatedAt: at,
    history: [createEvent(source === 'site' ? 'Заявка поступила с сайта' : 'Заявка принята', 'created', at)],
  };
  return { db: { ...db, clients, orders: [order, ...db.orders] }, order };
}
export function setOrderStatus(db: Database, id: string, status: Status): Database {
  if (!statuses.includes(status)) return db;
  return { ...db, orders: db.orders.map(order => order.id !== id || order.status === status ? order : {
    ...order, status, updatedAt: new Date().toISOString(),
    history: [...order.history, createEvent(`Статус изменён: ${statusLabels[order.status]} → ${statusLabels[status]}`, 'status')],
  }) };
}
export function orderMatches(order: Order, client: Client | undefined, query: string) {
  const q = query.trim().toLocaleLowerCase('ru');
  const text = [order.id, order.model, order.problem, client?.name, client?.phone, phoneDigits(client?.phone ?? '')].join(' ').toLocaleLowerCase('ru');
  return !q || text.includes(q) || (phoneDigits(q).length >= 3 && phoneDigits(client?.phone ?? '').includes(phoneDigits(q)));
}
export function parseDatabase(raw: string | null): Database | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Array.isArray(data.clients) || !Array.isArray(data.orders)) return null;
    if (data.clients.length > 10000 || data.orders.length > 20000) return null;
    const strings = (obj: Record<string, unknown>, fields: string[]) => fields.every(k => typeof obj?.[k] === 'string');
    if (!data.clients.every((c: Client) => strings(c, ['id', 'name', 'phone', 'note', 'createdAt']))) return null;
    const clientIds = new Set(data.clients.map((c: Client) => c.id));
    if (!data.orders.every((o: Order) => strings(o, ['id', 'clientId', 'model', 'device', 'problem', 'status', 'priority', 'masterId', 'due', 'source', 'createdAt', 'updatedAt']) && clientIds.has(o.clientId) && statuses.includes(o.status) && Object.hasOwn(deviceLabels, o.device) && ['normal', 'urgent'].includes(o.priority) && Number.isFinite(o.amount) && o.amount >= 0 && Array.isArray(o.history) && o.history.every(e => strings(e, ['id', 'text', 'at', 'kind'])))) return null;
    return data;
  } catch { return null; }
}

export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
