import { useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Pencil, UserRound, CircleDollarSign, Flag, Globe, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Panel, Select } from './ui';
import { dateLabel, displayPhone, masters, money, statuses, statusLabels, type Client, type Order, type Status } from './model.ts';

export default function OrderDetail({ order, client, onClose, onEdit, onClient, onStatus, onNote }: { order: Order; client: Client; onClose: () => void; onEdit: () => void; onClient: () => void; onStatus: (status: Status) => void; onNote: (note: string) => void }) {
  const [note, setNote] = useState('');
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const index = statuses.indexOf(order.status);
  const next = statuses[index + 1];
  const nextLabels: Record<string, string> = { diagnosis: 'На диагностику', repair: 'В ремонт', ready: 'Завершить ремонт', issued: 'Выдать клиенту' };
  return <Panel title={order.model} eyebrow={`Заявка ${order.id}`} drawer onClose={onClose}>
    <button type="button" className="crm-client-inline" onClick={onClient}><UserRound /><span>{client.name}</span><span className="crm-detail-phone">{displayPhone(client.phone)}</span></button>
    <ol className="crm-progress">{statuses.slice(0, 4).map((status, i) => <li key={status} className={i < index ? 'done' : i === index ? 'current' : ''}><span>{i < index || order.status === 'issued' ? <Check /> : i + 1}</span><small>{status === 'ready' ? 'Готово' : statusLabels[status]}</small></li>)}</ol>
    <div className="crm-status-controls"><Select label="Статус ремонта" value={order.status} onChange={s => onStatus(s as Status)}>{statuses.map(s => <option value={s} key={s}>{statusLabels[s]}</option>)}</Select>{next ? <Button onClick={() => onStatus(next)}>{nextLabels[next]}<ArrowRight data-icon="inline-end" /></Button> : <span className="crm-issued-note"><Check />Выдан клиенту</span>}</div>
    <section className="crm-detail-section"><div className="crm-detail-heading"><h3>Устройство и ремонт</h3><button type="button" className="crm-text-button" onClick={onEdit}><Pencil />Изменить данные</button></div><div className="crm-problem-block"><small>Проблема</small><p>{order.problem}</p></div><dl className="crm-detail-grid">
      <div><dt>Мастер</dt><dd><UserRound />{masters.find(m => m.id === order.masterId)?.name ?? 'Не назначен'}</dd></div><div><dt>Срок</dt><dd><CalendarDays />{dateLabel(order.due)}</dd></div>
      <div><dt>Приоритет</dt><dd className={order.priority === 'urgent' ? 'urgent' : ''}><Flag />{order.priority === 'urgent' ? 'Срочно' : 'Обычный'}</dd></div><div><dt>Стоимость</dt><dd><CircleDollarSign />{money(order.amount)}</dd></div>
    </dl>{order.source === 'site' && <p className="crm-order-source"><Globe />Заявка с сайта</p>}</section>
    <section className="crm-detail-section"><h3>История заявки</h3><ol className="crm-history">{order.history.map(event => <li key={event.id} className={event.kind}><span className="crm-history-dot" /><p>{event.text}</p><time dateTime={event.at}>{dateLabel(event.at)}, {new Date(event.at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</time></li>)}</ol>
      <form className="crm-note-form" onSubmit={e => { e.preventDefault(); if (note.trim()) { onNote(note); setNote(''); noteRef.current?.focus(); } }}><label htmlFor="order-comment" className="sr-only">Комментарий к заявке</label><Textarea ref={noteRef} id="order-comment" placeholder="Добавить комментарий…" rows={2} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} /><Button type="submit" disabled={!note.trim()}><MessageSquare data-icon="inline-start" />Добавить</Button></form>
    </section>
  </Panel>;
}
