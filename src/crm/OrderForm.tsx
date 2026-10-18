import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Panel, Select } from './ui';
import { dayOffset, deviceLabels, masters, validateOrder, type Client, type DeviceKind, type Order, type OrderInput, type Priority, type Status } from './model.ts';

export default function OrderForm({ clients, initialClient, initialStatus = 'new', order, onSave, onClose }: {
  clients: Client[]; initialClient?: string; initialStatus?: Status; order?: Order;
  onSave: (input: OrderInput) => void; onClose: () => void;
}) {
  const client = clients.find(c => c.id === (order?.clientId || initialClient));
  const [values, setValues] = useState({
    clientId: client?.id ?? '', name: client?.name ?? '', phone: client?.phone ?? '',
    model: order?.model ?? '', device: order?.device ?? 'phone', problem: order?.problem ?? '',
    status: order?.status ?? initialStatus, priority: order?.priority ?? 'normal', masterId: order?.masterId ?? '',
    amount: String(order?.amount ?? ''), due: order?.due ?? dayOffset(2),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const update = (key: keyof typeof values, value: string) => { setValues(v => ({ ...v, [key]: value })); setErrors(e => ({ ...e, [key]: '' })); };
  const pickClient = (id: string) => {
    const picked = clients.find(c => c.id === id);
    setValues(v => ({ ...v, clientId: id, name: picked?.name ?? '', phone: picked?.phone ?? '' }));
    setErrors({});
  };
  function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const input: OrderInput = { ...values, amount: values.amount === '' ? 0 : Number(values.amount), device: values.device as DeviceKind, priority: values.priority as Priority };
    const validation = validateOrder(input);
    setErrors(validation);
    if (Object.keys(validation).length) { document.getElementById(`order-${Object.keys(validation)[0]}`)?.focus(); return; }
    setSaving(true);
    try { onSave(input); } catch (e) { setErrors({ form: e instanceof Error ? e.message : 'Не удалось сохранить заявку.' }); setSaving(false); }
  }
  const inputField = (key: 'name' | 'phone' | 'model' | 'amount' | 'due', label: string, type = 'text', placeholder = '') => <Field data-invalid={!!errors[key]}>
    <FieldLabel htmlFor={`order-${key}`}>{label}</FieldLabel><Input id={`order-${key}`} type={type} value={values[key]} placeholder={placeholder} onChange={e => update(key, e.target.value)} maxLength={key === 'model' ? 100 : 60} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 10000000 : undefined} disabled={!!values.clientId && (key === 'name' || key === 'phone')} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `order-${key}-error` : undefined} />
    {errors[key] && <p className="crm-field-error" id={`order-${key}-error`}>{errors[key]}</p>}
  </Field>;
  return <Panel title={order ? 'Редактирование заявки' : 'Новая заявка'} subtitle={order ? order.id : 'Добавьте устройство и договорённости с клиентом.'} onClose={onClose}>
    <form onSubmit={submit} noValidate className="crm-form"><FieldGroup>
      <Field><FieldLabel htmlFor="order-client">Клиент</FieldLabel><Select id="order-client" label="Выбор клиента" value={values.clientId} onChange={pickClient} disabled={!!order}><option value="">Новый клиент</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}</Select></Field>
      <div className="crm-form-grid">{inputField('name', 'Имя клиента', 'text', 'Имя и фамилия')}{inputField('phone', 'Телефон клиента', 'tel', '+7 (900) 000-00-00')}</div>
      <div className="crm-form-grid"><Field><FieldLabel htmlFor="order-device">Тип устройства</FieldLabel><Select id="order-device" label="Тип устройства" value={values.device} onChange={v => update('device', v)}>{Object.entries(deviceLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></Field>{inputField('model', 'Модель', 'text', 'Например, iPhone 15')}</div>
      <Field data-invalid={!!errors.problem}><FieldLabel htmlFor="order-problem">Неисправность</FieldLabel><Textarea id="order-problem" rows={3} maxLength={1000} value={values.problem} onChange={e => update('problem', e.target.value)} placeholder="Что случилось с устройством?" aria-invalid={!!errors.problem} aria-describedby={errors.problem ? 'order-problem-error' : undefined} />{errors.problem && <p id="order-problem-error" className="crm-field-error">{errors.problem}</p>}</Field>
      <div className="crm-form-grid"><Field><FieldLabel htmlFor="order-master">Мастер</FieldLabel><Select id="order-master" label="Мастер заявки" value={values.masterId} onChange={v => update('masterId', v)}><option value="">Не назначен</option>{masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>{inputField('due', 'Срок ремонта', 'date')}</div>
      <div className="crm-form-grid">{inputField('amount', 'Стоимость, ₽', 'number', '0')}<Field><FieldLabel htmlFor="order-priority">Приоритет</FieldLabel><Select id="order-priority" label="Приоритет" value={values.priority} onChange={v => update('priority', v)}><option value="normal">Обычный</option><option value="urgent">Срочно</option></Select></Field></div>
      {errors.form && <p role="alert" className="crm-field-error">{errors.form}</p>}
      <div className="crm-form-actions"><Button type="button" variant="outline" onClick={onClose}>Отмена</Button><Button type="submit" disabled={saving}>{order ? 'Сохранить изменения' : 'Создать заявку'}</Button></div>
    </FieldGroup></form>
  </Panel>;
}
