import { dayOffset, type Database, type Order, type DeviceKind, type Status } from './model.ts';

export function createSeed(now = new Date()): Database {
  const names = ['Анна Смирнова', 'Дмитрий Кузнецов', 'Елена Петрова', 'Игорь Волков', 'Ольга Новикова', 'Сергей Иванов', 'Мария Ковалёва', 'Павел Орлов', 'Алексей Морозов', 'Наталья Соколова'];
  const clients = names.map((name, i) => ({ id: `client-${i + 1}`, name, phone: `+790000010${String(i + 1).padStart(2, '0')}`, note: i === 0 ? 'Предпочитает связь после 18:00.' : i === 1 ? 'Приносит технику для работы. Важно согласовать сроки.' : '', createdAt: new Date(now.valueOf() - (30 - i) * 86400000).toISOString() }));
  const rows: [string, number, string, DeviceKind, string, Status, number, string, number, boolean][] = [
    ['КТ-1024', 1, 'iPhone 13 Pro', 'phone', 'Разбит экран, не работает сенсор', 'new', 8500, 'ilya', 0, true],
    ['КТ-1025', 2, 'MacBook Air M1', 'laptop', 'Не включается после разрядки', 'new', 12000, 'andrey', 0, false],
    ['КТ-1021', 3, 'Samsung Galaxy S22', 'phone', 'Быстро разряжается. Замена аккумулятора', 'diagnosis', 6500, 'sofia', 1, false],
    ['КТ-1026', 4, 'iPhone 12', 'phone', 'Ремонт разъёма зарядки', 'diagnosis', 7000, 'maxim', 2, false],
    ['КТ-1022', 5, 'Lenovo IdeaPad 5', 'laptop', 'Чистка системы охлаждения', 'repair', 4000, 'ilya', 1, false],
    ['КТ-1023', 6, 'iPhone 14', 'phone', 'Замена заднего стекла', 'repair', 11500, 'andrey', 0, true],
    ['КТ-1028', 7, 'MacBook Pro 14″', 'laptop', 'Замена клавиатуры после залития', 'repair', 18000, 'sofia', 4, false],
    ['КТ-1027', 8, 'iPad Air', 'tablet', 'Замена кнопки включения', 'repair', 3000, 'maxim', 2, false],
    ['КТ-1019', 9, 'iPhone 11', 'phone', 'Замена аккумулятора', 'ready', 5500, 'maxim', 0, false],
    ['КТ-1020', 10, 'Samsung Galaxy A54', 'phone', 'Замена дисплея', 'ready', 9500, 'ilya', 0, false],
    ['КТ-1015', 1, 'iPad mini 6', 'tablet', 'Замена защитного стекла', 'issued', 2500, 'ilya', -4, false],
    ['КТ-1017', 2, 'Lenovo ThinkPad', 'laptop', 'Установка SSD и настройка системы', 'issued', 7800, 'andrey', -2, false],
  ];
  const orders: Order[] = rows.map(([id, client, model, device, problem, status, amount, masterId, due, urgent], i) => {
    const created = new Date(now.valueOf() - (i + 1) * 3600000).toISOString();
    const history: Order['history'] = [{ id: `${id}-created`, at: created, kind: 'created', text: i === 0 ? 'Заявка поступила с сайта' : 'Заявка принята' }];
    if (status !== 'new') history.push({ id: `${id}-status`, at: new Date(now.valueOf() - i * 1800000).toISOString(), kind: 'status', text: status === 'issued' ? 'Устройство выдано клиенту' : status === 'ready' ? 'Ремонт завершён. Устройство проверено' : 'Устройство передано мастеру' });
    if (status === 'repair') history.push({ id: `${id}-note`, at: new Date(now.valueOf() - i * 900000).toISOString(), kind: 'note', text: 'Стоимость согласована с клиентом. Детали в наличии.' });
    return { id, clientId: `client-${client}`, model, device, problem, status, amount, masterId, due: dayOffset(due, now), priority: urgent ? 'urgent' : 'normal', source: i === 0 ? 'site' : 'manual', createdAt: created, updatedAt: history.at(-1)!.at, history };
  });
  return { version: 1, clients, orders };
}
