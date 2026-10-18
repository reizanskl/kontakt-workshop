import { useState } from 'react';
import { CalendarDays, Check, UserRound, Plus, ArrowUpRight, GripVertical } from 'lucide-react';
import { Avatar, Empty } from './ui';
import { columnLabels, dateLabel, dueLabel, isOverdue, localDay, masters, money, statusLabels, type Client, type Order, type Status } from './model.ts';

export function OrderCard({ order, client, onOpen, onDragStart, onDragEnd }: { order: Order; client?: Client; onOpen: () => void; onDragStart: () => void; onDragEnd: () => void }) {
  const master = masters.find(m => m.id === order.masterId);
  return <article className="crm-order-card" draggable onDragStart={event => { event.dataTransfer.setData('text/plain', order.id); event.dataTransfer.effectAllowed = 'move'; onDragStart(); }} onDragEnd={onDragEnd} data-order={order.id}>
    <button type="button" className="crm-card-open" onClick={onOpen} aria-label={`Открыть ${order.id}: ${order.model}`}>
      <div className="crm-card-top"><span>{order.id}</span>{order.priority === 'urgent' ? <span className="crm-urgent">Срочно</span> : <GripVertical className="crm-drag-grip" aria-hidden="true" />}</div>
      <h3>{order.model}</h3><p className="crm-card-problem">{order.problem}</p>
      <div className="crm-card-client"><UserRound aria-hidden="true" /><span>{client?.name ?? 'Клиент'}</span></div>
      <div className="crm-card-bottom"><span className={`crm-due ${order.status === 'ready' ? 'ready' : isOverdue(order) || order.due === localDay() ? 'today' : ''}`}>{order.status === 'ready' ? <Check aria-hidden="true" /> : <CalendarDays aria-hidden="true" />}<span>{dueLabel(order.due, order.status)}</span></span><strong>{money(order.amount)}</strong><span title={master?.name ?? 'Мастер не назначен'}><Avatar initials={master?.initials ?? '—'} /></span></div>
    </button>
  </article>;
}
export function Board({ orders, clients, onOpen, onAdd, onMove }: { orders: Order[]; clients: Map<string, Client>; onOpen: (id: string) => void; onAdd: (status: Status) => void; onMove: (id: string, status: Status) => void }) {
  const [dragging, setDragging] = useState('');
  const [over, setOver] = useState<Status | null>(null);
  return <div className="crm-board" aria-label="Доска заявок">
    {(['new', 'diagnosis', 'repair', 'ready'] as Status[]).map(status => {
      const items = orders.filter(o => o.status === status);
      return <section className={`crm-column ${over === status && dragging ? 'drag-over' : ''}`} key={status} data-status={status} onDragOver={e => { if (dragging) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOver(status); } }} onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (dragging && id === dragging) onMove(id, status); setDragging(''); setOver(null); }}>
        <header className="crm-column-head"><span className={`crm-status-dot ${status}`} /><h2>{columnLabels[status]}</h2><span className="crm-column-count">{items.length}</span></header>
        <div className="crm-column-cards">{items.map(order => <OrderCard key={order.id} order={order} client={clients.get(order.clientId)} onOpen={() => onOpen(order.id)} onDragStart={() => setDragging(order.id)} onDragEnd={() => { setDragging(''); setOver(null); }} />)}{!items.length && <div className="crm-empty-column">Здесь пока нет заявок</div>}</div>
        <button className="crm-column-add" type="button" onClick={() => onAdd(status)} aria-label={`Добавить заявку: ${columnLabels[status]}`}><Plus aria-hidden="true" />Добавить заявку</button>
      </section>;
    })}
  </div>;
}
export function OrderTable({ orders, clients, onOpen }: { orders: Order[]; clients: Map<string, Client>; onOpen: (id: string) => void }) {
  if (!orders.length) return <Empty />;
  return <div className="crm-table-scroll"><table className="crm-table"><thead><tr><th>Заявка / устройство</th><th>Клиент</th><th>Статус</th><th>Мастер</th><th>Срок</th><th className="align-right">Стоимость</th><th><span className="sr-only">Открыть</span></th></tr></thead><tbody>{orders.map(order => <tr key={order.id}>
    <td><button className="crm-table-link" onClick={() => onOpen(order.id)}><span className="crm-table-id">{order.id}{order.priority === 'urgent' && <span className="crm-priority-dot" title="Срочно" />}</span><strong>{order.model}</strong><span className="crm-table-issue">{order.problem}</span></button></td>
    <td>{clients.get(order.clientId)?.name}</td><td><span className={`crm-status-pill ${order.status}`}><span className={`crm-status-dot ${order.status}`} />{statusLabels[order.status]}</span></td>
    <td><span className="crm-table-master"><Avatar initials={masters.find(m => m.id === order.masterId)?.initials ?? '—'} /><span>{masters.find(m => m.id === order.masterId)?.name.split(' ')[0] ?? 'Не назначен'}</span></span></td>
    <td><span className={isOverdue(order) ? 'crm-overdue' : ''}>{dateLabel(order.due, true)}</span></td><td className="align-right"><strong>{money(order.amount)}</strong></td><td><button className="crm-icon-button" onClick={() => onOpen(order.id)} aria-label={`Открыть ${order.id}`}><ArrowUpRight /></button></td>
  </tr>)}</tbody></table></div>;
}
