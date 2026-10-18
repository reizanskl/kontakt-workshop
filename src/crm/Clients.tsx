import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Phone, Plus, Pencil, Clock3, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Avatar, Empty, Panel } from './ui';
import { dateLabel, displayPhone, initials, money, statusLabels, validateClient, type Client, type Order } from './model.ts';

export function ClientTable({ clients, orders, onOpen }: { clients: Client[]; orders: Order[]; onOpen: (id: string) => void }) {
  if (!clients.length) return <Empty title="Клиенты не найдены" text="Измените запрос или добавьте нового клиента." />;
  return <div className="crm-table-scroll"><table className="crm-table crm-client-table"><thead><tr><th>Клиент</th><th>Телефон</th><th>Обращения</th><th>В работе</th><th>Сумма заказов</th><th>Последнее обращение</th><th><span className="sr-only">Открыть</span></th></tr></thead><tbody>{clients.map(client => {
    const owned = orders.filter(o => o.clientId === client.id);
    const latest = owned.reduce((last, o) => o.createdAt > last ? o.createdAt : last, client.createdAt);
    return <tr key={client.id}><td><button className="crm-client-name" onClick={() => onOpen(client.id)}><Avatar initials={initials(client.name)} /><span><strong>{client.name}</strong><small>{[...new Set(owned.map(o => o.model))].slice(0, 2).join(' · ') || 'Пока без устройств'}</small></span></button></td><td className="crm-phone-cell">{displayPhone(client.phone)}</td><td>{owned.length}</td><td>{owned.filter(o => o.status !== 'issued').length || '—'}</td><td><strong>{money(owned.reduce((n, o) => n + o.amount, 0))}</strong></td><td>{dateLabel(latest, true)}</td><td><button className="crm-icon-button" onClick={() => onOpen(client.id)} aria-label={`Карточка клиента ${client.name}`}><ArrowUpRight /></button></td></tr>;
  })}</tbody></table></div>;
}
export function ClientDetail({ client, orders, onClose, onEdit, onNewOrder, onOrder }: { client: Client; orders: Order[]; onClose: () => void; onEdit: () => void; onNewOrder: () => void; onOrder: (id: string) => void }) {
  const owned = orders.filter(o => o.clientId === client.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <Panel title={client.name} eyebrow="Карточка клиента" drawer onClose={onClose}>
    <div className="crm-client-profile"><Avatar initials={initials(client.name)} large /><div><p><Phone />{displayPhone(client.phone)}</p><small>В базе с {dateLabel(client.createdAt)}</small></div><button className="crm-icon-button" onClick={onEdit} aria-label="Редактировать клиента"><Pencil /></button></div>
    <div className="crm-client-stats"><div><strong>{owned.length}</strong><span>обращения</span></div><div><strong>{owned.filter(o => o.status !== 'issued').length}</strong><span>в работе</span></div><div><strong>{money(owned.reduce((n, o) => n + o.amount, 0))}</strong><span>сумма заказов</span></div></div>
    {client.note && <section className="crm-client-note"><h3>Заметка о клиенте</h3><p>{client.note}</p></section>}
    <div className="crm-detail-heading"><h3>История обращений</h3><Button size="sm" onClick={onNewOrder}><Plus data-icon="inline-start" />Новая заявка</Button></div>
    <div className="crm-client-orders">{owned.map(order => <button key={order.id} onClick={() => onOrder(order.id)} className="crm-client-order"><span className="crm-device-icon"><Smartphone /></span><span className="crm-client-order-copy"><small>{order.id} · {dateLabel(order.createdAt, true)}</small><strong>{order.model}</strong><span>{order.problem}</span><span className={`crm-status-pill ${order.status}`}><span className={`crm-status-dot ${order.status}`} />{statusLabels[order.status]}</span></span><strong>{money(order.amount)}</strong><ArrowUpRight /></button>)}</div>
    {!owned.length && <Empty title="Обращений пока нет" text="Создайте первую заявку для этого клиента." />}
    <p className="crm-record-meta"><Clock3 />Данные клиента связаны со всеми его заявками.</p>
  </Panel>;
}
export function ClientForm({ client, onSave, onClose }: { client?: Client; onSave: (value: Pick<Client, 'name' | 'phone' | 'note'>) => void; onClose: () => void }) {
  const [values, setValues] = useState({ name: client?.name ?? '', phone: client?.phone ?? '', note: client?.note ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  function submit(e: FormEvent) {
    e.preventDefault(); const validation = validateClient(values.name, values.phone); setErrors(validation);
    if (Object.keys(validation).length) { document.getElementById(`client-${Object.keys(validation)[0]}`)?.focus(); return; }
    try { onSave(values); } catch (error) { setErrors({ form: error instanceof Error ? error.message : 'Не удалось сохранить клиента.' }); }
  }
  return <Panel title={client ? 'Редактирование клиента' : 'Новый клиент'} subtitle="Контактные данные и важные детали." onClose={onClose}><form className="crm-form" onSubmit={submit} noValidate><FieldGroup>
    {(['name', 'phone'] as const).map(key => <Field data-invalid={!!errors[key]} key={key}><FieldLabel htmlFor={`client-${key}`}>{key === 'name' ? 'Имя клиента' : 'Телефон клиента'}</FieldLabel><Input id={`client-${key}`} type={key === 'phone' ? 'tel' : 'text'} maxLength={key === 'name' ? 60 : 30} value={values[key]} onChange={e => { setValues(v => ({ ...v, [key]: e.target.value })); setErrors(v => ({ ...v, [key]: '' })); }} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `client-${key}-error` : undefined} />{errors[key] && <p className="crm-field-error" id={`client-${key}-error`}>{errors[key]}</p>}</Field>)}
    <Field><FieldLabel htmlFor="client-note">Заметка</FieldLabel><Textarea id="client-note" placeholder="Удобное время связи, пожелания…" maxLength={1000} value={values.note} onChange={e => setValues(v => ({ ...v, note: e.target.value }))} /></Field>
    {errors.form && <p role="alert" className="crm-field-error">{errors.form}</p>}
    <div className="crm-form-actions"><Button type="button" variant="outline" onClick={onClose}>Отмена</Button><Button type="submit">{client ? 'Сохранить клиента' : 'Добавить клиента'}</Button></div>
  </FieldGroup></form></Panel>;
}
