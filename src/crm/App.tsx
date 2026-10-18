import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, ArrowUpRight, Check, CheckCheck, ClipboardList, Coins, Download, ExternalLink, LayoutDashboard, List, Menu, Plus, RotateCcw, Search, ShieldCheck, UsersRound, Wrench, X, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Board, OrderTable } from './Board';
import { ClientDetail, ClientForm, ClientTable } from './Clients';
import OrderDetail from './OrderDetail';
import OrderForm from './OrderForm';
import { Avatar, Empty, Panel, Select } from './ui';
import { addNote, addOrder, changeStatus, editOrder, resetData, saveClient, useCRM } from './store.ts';
import { csvCell, deviceLabels, masters, money, orderMatches, phoneDigits, statusLabels, type OrderInput, type Status } from './model.ts';

type Page = 'orders' | 'clients' | 'archive';
type Modal = { kind: 'order'; id: string } | { kind: 'orderForm'; id?: string; status?: Status; clientId?: string } | { kind: 'client'; id: string } | { kind: 'clientForm'; id?: string } | { kind: 'reset' } | null;
const getPage = (): Page => location.hash === '#clients' ? 'clients' : location.hash === '#archive' ? 'archive' : 'orders';
const pageLabels = { orders: 'Заявки', clients: 'Клиенты', archive: 'Архив' };
const subtitles = { orders: 'Каждое устройство — на своём этапе.', clients: 'Все обращения. Одна история клиента.', archive: 'Завершённые ремонты и выданная техника.' };

export default function App() {
  const { data, error } = useCRM();
  const [page, setPage] = useState<Page>(getPage);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [query, setQuery] = useState('');
  const [device, setDevice] = useState('all');
  const [master, setMaster] = useState('all');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState<{ text: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const notify = (text: string) => setToast({ text });
  useEffect(() => { const handle = () => { setPage(getPage()); setQuery(''); setDevice('all'); setMaster('all'); setUrgentOnly(false); setMobileNav(false); setModal(null); }; window.addEventListener('hashchange', handle); return () => window.removeEventListener('hashchange', handle); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 3800); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if (event.key === '/' && !modal && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLSelectElement)) { event.preventDefault(); searchRef.current?.focus(); } if (event.key === 'Escape') setMobileNav(false); };
    window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut);
  }, [modal]);
  const clientMap = useMemo(() => new Map(data.clients.map(c => [c.id, c])), [data.clients]);
  const openOrders = data.orders.filter(o => o.status !== 'issued');
  const orders = data.orders.filter(o => (page === 'archive' ? o.status === 'issued' : o.status !== 'issued') && orderMatches(o, clientMap.get(o.clientId), query) && (device === 'all' || o.device === device) && (master === 'all' || (master === 'none' ? !o.masterId : o.masterId === master)) && (!urgentOnly || o.priority === 'urgent'));
  const clients = data.clients.filter(client => {
    const q = query.trim().toLocaleLowerCase('ru');
    return !q || `${client.name} ${client.phone}`.toLocaleLowerCase('ru').includes(q) || (phoneDigits(q).length >= 3 && phoneDigits(client.phone).includes(phoneDigits(q))) || data.orders.some(o => o.clientId === client.id && o.model.toLocaleLowerCase('ru').includes(q));
  });
  const resetFilters = () => { setQuery(''); setDevice('all'); setMaster('all'); setUrgentOnly(false); };
  function move(id: string, status: Status) {
    const current = data.orders.find(o => o.id === id);
    if (!current || current.status === status) return;
    changeStatus(id, status);
    notify(status === 'issued' ? `${id} выдана и перенесена в архив` : `${id} · ${statusLabels[status]}`);
  }
  function submitOrder(input: OrderInput) {
    if (modal?.kind !== 'orderForm') return;
    if (modal.id) { editOrder(modal.id, input); setModal({ kind: 'order', id: modal.id }); notify('Данные ремонта обновлены'); }
    else { const { order } = addOrder(input); setModal({ kind: 'order', id: order.id }); notify(`Заявка ${order.id} создана`); }
  }
  function exportOrders() {
    const lines = [['Заявка', 'Устройство', 'Клиент', 'Телефон', 'Статус', 'Стоимость', 'Срок'], ...orders.map(o => [o.id, o.model, clientMap.get(o.clientId)?.name ?? '', clientMap.get(o.clientId)?.phone ?? '', statusLabels[o.status], o.amount, o.due])];
    const blob = new Blob(['\uFEFF' + lines.map(row => row.map(csvCell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `kontakt-${page}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Таблица выгружена в CSV');
  }
  const selectedOrder = modal && 'id' in modal ? data.orders.find(o => o.id === modal.id) : undefined;
  const selectedClient = modal && 'id' in modal ? clientMap.get(modal.id ?? '') : undefined;
  return <div className="crm-surface crm-app">
    <a className="crm-skip" href="#crm-content">Перейти к заявкам</a>
    <aside className={`crm-sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <a href="#orders" className="crm-brand"><strong>контакт</strong><span>Управление мастерской</span></a>
      <nav className="crm-navigation" aria-label="Разделы CRM">{([{ id: 'orders', icon: ClipboardList }, { id: 'clients', icon: UsersRound }, { id: 'archive', icon: Archive }] as const).map(item => <a key={item.id} href={`#${item.id}`} className={page === item.id ? 'active' : ''} aria-current={page === item.id ? 'page' : undefined} onClick={() => setMobileNav(false)}><item.icon /><span>{pageLabels[item.id]}</span></a>)}</nav>
      <div className="crm-sidebar-bottom"><a href="../" className="crm-sidebar-action"><ExternalLink />Открыть сайт</a><button className="crm-sidebar-action" onClick={() => { setModal({ kind: 'reset' }); setMobileNav(false); }}><RotateCcw />Сбросить данные</button><div className="crm-profile"><Avatar initials="МК" /><div><strong>Максим</strong><small>Администратор</small></div></div></div>
    </aside>
    {mobileNav && <button className="crm-nav-backdrop" aria-label="Закрыть навигацию" onClick={() => setMobileNav(false)} />}
    <div className="crm-workspace">
      <header className="crm-topbar"><button className="crm-menu-toggle crm-icon-button" aria-label={mobileNav ? 'Закрыть меню CRM' : 'Открыть меню CRM'} aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X /> : <Menu />}</button><div className="crm-breadcrumb"><span>Мастерская</span><span>/</span><strong>{pageLabels[page]}</strong></div><div className="crm-topbar-right"><time>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</time><Avatar initials="МК" /></div></header>
      <main className="crm-content" id="crm-content">
        <div className="crm-page-heading"><div><h1>{pageLabels[page]}</h1><p>{subtitles[page]}</p></div><div className="crm-heading-actions">{page === 'archive' || (page === 'orders' && view === 'list') ? <Button variant="outline" onClick={exportOrders} disabled={!orders.length}><Download data-icon="inline-start" /><span>Экспорт CSV</span></Button> : null}{page !== 'archive' && <Button onClick={() => setModal({ kind: page === 'clients' ? 'clientForm' : 'orderForm' })}><Plus data-icon="inline-start" />{page === 'clients' ? 'Новый клиент' : 'Новая заявка'}</Button>}</div></div>
        {page === 'orders' && <section className="crm-metrics" aria-label="Сводка по ремонтам">
          <div className="crm-metric"><span className="crm-metric-icon green"><Wrench /></span><div><span>Активных ремонтов</span><strong>{openOrders.filter(o => o.status !== 'ready').length}</strong></div></div>
          <div className="crm-metric"><span className="crm-metric-icon green"><Check /></span><div><span>Готовы к выдаче</span><strong>{openOrders.filter(o => o.status === 'ready').length}</strong></div></div>
          <button className={`crm-metric metric-button ${urgentOnly ? 'is-filtered' : ''}`} onClick={() => setUrgentOnly(!urgentOnly)} aria-label="Показать только срочные заявки" aria-pressed={urgentOnly}><span className="crm-metric-icon coral"><CircleAlert /></span><span><span>Срочных</span><strong>{openOrders.filter(o => o.priority === 'urgent').length}</strong></span></button>
          <div className="crm-metric"><span className="crm-metric-icon amber"><Coins /></span><div><span>Стоимость работ</span><strong>{money(openOrders.reduce((n, o) => n + o.amount, 0))}</strong></div></div>
        </section>}
        {page === 'clients' && <section className="crm-client-overview"><span><UsersRound />{data.clients.length} клиентов в базе</span><span><Wrench />{openOrders.length} открытых заявок</span><span><ShieldCheck />Единая история обращений</span></section>}
        {page === 'archive' && <div className="crm-archive-summary"><span className="crm-metric-icon green"><CheckCheck /></span><div><strong>{data.orders.filter(o => o.status === 'issued').length} ремонта завершено</strong><p>Выданные устройства сохраняются здесь вместе с историей работ.</p></div></div>}
        {error && <div role="alert" className="crm-storage-error">{error}</div>}
        <div className="crm-toolbar"><div className="crm-search"><Search aria-hidden="true" /><Input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} aria-label={page === 'clients' ? 'Поиск клиентов' : 'Поиск заявок'} placeholder={page === 'clients' ? 'Найти клиента, телефон, устройство…' : 'Найти заявку, клиента, устройство…'} />{query ? <button className="crm-search-clear" onClick={() => setQuery('')} aria-label="Очистить поиск"><X /></button> : <kbd>/</kbd>}</div>
          {page !== 'clients' && <><Select label="Фильтр устройств" value={device} onChange={setDevice}><option value="all">Все устройства</option>{Object.entries(deviceLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</Select><Select label="Фильтр мастеров" value={master} onChange={setMaster}><option value="all">Все мастера</option><option value="none">Не назначен</option>{masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></>}
          {page === 'orders' && <div className="crm-view-switch" aria-label="Вид заявок"><button className={view === 'board' ? 'active' : ''} aria-pressed={view === 'board'} onClick={() => setView('board')}><LayoutDashboard />Доска</button><button className={view === 'list' ? 'active' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}><List />Список</button></div>}
        </div>
        {(query || device !== 'all' || master !== 'all' || urgentOnly) && <div className="crm-filter-summary"><span>Найдено: {page === 'clients' ? clients.length : orders.length}{urgentOnly ? ' · только срочные' : ''}</span><button onClick={resetFilters}>Сбросить фильтры<X /></button></div>}
        {page === 'clients' ? <ClientTable clients={clients} orders={data.orders} onOpen={id => setModal({ kind: 'client', id })} /> : page === 'archive' || view === 'list' ? <OrderTable orders={orders} clients={clientMap} onOpen={id => setModal({ kind: 'order', id })} /> : !orders.length && (query || master !== 'all' || device !== 'all' || urgentOnly) ? <Empty><Button variant="outline" onClick={resetFilters}>Сбросить фильтры</Button></Empty> : <Board orders={orders} clients={clientMap} onOpen={id => setModal({ kind: 'order', id })} onAdd={status => setModal({ kind: 'orderForm', status })} onMove={move} />}
        <footer className="crm-workspace-footer"><span><Check />Изменения сохраняются в этом браузере</span><span>Контакт · CodeRivento</span></footer>
      </main>
    </div>
    {modal?.kind === 'orderForm' && <OrderForm key={modal.id ?? modal.clientId ?? 'new'} clients={data.clients} initialClient={modal.clientId} initialStatus={modal.status} order={selectedOrder} onSave={submitOrder} onClose={() => setModal(null)} />}
    {modal?.kind === 'order' && selectedOrder && clientMap.has(selectedOrder.clientId) && <OrderDetail key={selectedOrder.id} order={selectedOrder} client={clientMap.get(selectedOrder.clientId)!} onClose={() => setModal(null)} onEdit={() => setModal({ kind: 'orderForm', id: selectedOrder.id })} onClient={() => setModal({ kind: 'client', id: selectedOrder.clientId })} onStatus={status => move(selectedOrder.id, status)} onNote={note => { addNote(selectedOrder.id, note); notify('Комментарий добавлен в историю'); }} />}
    {modal?.kind === 'client' && selectedClient && <ClientDetail client={selectedClient} orders={data.orders} onClose={() => setModal(null)} onEdit={() => setModal({ kind: 'clientForm', id: selectedClient.id })} onNewOrder={() => setModal({ kind: 'orderForm', clientId: selectedClient.id })} onOrder={id => setModal({ kind: 'order', id })} />}
    {modal?.kind === 'clientForm' && <ClientForm key={modal.id ?? 'new-client'} client={selectedClient} onClose={() => setModal(null)} onSave={value => { const client = saveClient(value, modal.id); setModal({ kind: 'client', id: client.id }); notify(modal.id ? 'Данные клиента обновлены' : 'Клиент добавлен'); }} />}
    {modal?.kind === 'reset' && <Panel title="Вернуть исходные данные?" subtitle="Добавленные в этом браузере заявки, клиенты и комментарии будут удалены. Вернётся начальный набор из 12 ремонтов." onClose={() => setModal(null)}><div className="crm-form-actions"><Button variant="outline" onClick={() => setModal(null)}>Отмена</Button><Button onClick={() => { resetData(); resetFilters(); setModal(null); notify('Исходные данные восстановлены'); }}>Восстановить данные</Button></div></Panel>}
    {toast && <div className="crm-toast" role="status"><Check /><span>{toast.text}</span><button onClick={() => setToast(null)} aria-label="Закрыть уведомление"><X /></button></div>}
  </div>;
}
