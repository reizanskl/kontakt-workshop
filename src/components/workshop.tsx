import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { validateLead, type Device, type FieldErrors } from '@/lib/lead-schema';
import { addOrder } from '@/crm/store';
import { dayOffset, deviceLabels } from '@/crm/model';

function Arrow({ diagonal = false, ...props }: React.SVGProps<SVGSVGElement> & { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{diagonal ? <path d="M5 19 19 5M5 5h14v14" /> : <path d="M4 12h16m-7-7 7 7-7 7" />}</svg>;
}

type Service = { title: string; detail: string; price: string };
const services: Record<'phone' | 'laptop', Service[]> = {
  phone: [
    { title: 'Замена экрана', detail: 'Трещины, полосы и неработающий сенсор', price: '2 500' },
    { title: 'Замена аккумулятора', detail: 'Быстро разряжается или выключается', price: '1 500' },
    { title: 'Ремонт разъёма', detail: 'Не заряжается или пропадает контакт', price: '1 800' },
  ],
  laptop: [
    { title: 'Чистка и охлаждение', detail: 'Перегревается, шумит или выключается', price: '2 000' },
    { title: 'Замена клавиатуры', detail: 'Клавиши не работают или западают', price: '2 500' },
    { title: 'Апгрейд и настройка', detail: 'Медленно работает или не хватает памяти', price: '1 500' },
  ],
};
const faqs = [
  ['Нужна ли диагностика?', 'Одинаковые симптомы могут иметь разные причины. Поэтому сначала проверяем устройство, а затем согласовываем необходимые работы и стоимость.'],
  ['Можно ли отказаться от ремонта?', 'Да. Решение остаётся за вами: ремонт начинается только после согласования стоимости и необходимых работ.'],
  ['Что указать в заявке?', 'Напишите модель устройства и опишите, что произошло. Например: ноутбук сильно нагревается, телефон перестал заряжаться или экран не реагирует на касания.'],
];

export default function Workshop() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState<'phone' | 'laptop'>('phone');
  const [fields, setFields] = useState({ name: '', phone: '', device: 'phone' as Device, problem: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const lastSubmission = useRef('');
  const successHeading = useRef<HTMLHeadingElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (submitted) successHeading.current?.focus(); }, [submitted]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);

  function update<K extends keyof typeof fields>(key: K, value: typeof fields[K]) {
    setFields(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined }));
  }
  function chooseService(service: Service) {
    setFields(current => ({ ...current, device: category, problem: `${service.title}. Модель устройства: ` }));
    setSubmitted(false);
    setErrors({});
    document.getElementById('request')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    requestAnimationFrame(() => document.getElementById('name')?.focus({ preventScroll: true }));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateLead(fields);
    setErrors(validation.errors);
    if (!validation.lead) {
      document.getElementById(Object.keys(validation.errors)[0])?.focus();
      return;
    }
    const fingerprint = JSON.stringify(validation.lead);
    if (lastSubmission.current !== fingerprint) {
      addOrder({ ...validation.lead, model: deviceLabels[validation.lead.device], status: 'new', priority: 'normal', masterId: '', amount: 0, due: dayOffset(2) }, 'site');
      lastSubmission.current = fingerprint;
    }
    setSubmitted(true);
  }
  function editRequest() {
    setSubmitted(false);
    requestAnimationFrame(() => document.getElementById('name')?.focus());
  }
  const fieldError = (key: keyof FieldErrors) => errors[key] ? <p className="field-error" id={`${key}-error`}>{errors[key]}</p> : null;

  return <>
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    <header className="site-header container">
      <a href="#main" className="wordmark" aria-label="Контакт — начало страницы">контакт</a>
      <nav className="desktop-nav" aria-label="Основная навигация"><a href="#services">Услуги</a><a href="#process">Как работаем</a><a href="#faq">Вопросы</a><a href="./crm/">CRM мастерской</a></nav>
      <Button asChild variant="outline" className="header-cta"><a href="#request">Обсудить ремонт</a></Button>
      <button className="menu-toggle" type="button" ref={menuButton} aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}><svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{menuOpen ? <path d="m5 5 14 14M19 5 5 19" /> : <path d="M3 7h18M3 12h18M3 17h18" />}</svg></button>
      {menuOpen && <nav className="mobile-menu" id="mobile-menu" aria-label="Мобильная навигация">{[['#services', 'Услуги'], ['#process', 'Как работаем'], ['#faq', 'Вопросы'], ['./crm/', 'CRM мастерской'], ['#request', 'Обсудить ремонт']].map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}<Arrow /></a>)}</nav>}
    </header>
    <main id="main">
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy"><h1 id="hero-title">Техника снова<br />на вашей<br />стороне.</h1><p className="hero-description">Ремонтируем смартфоны и ноутбуки.<br className="desktop-break" /> Объясняем, что сломалось, и согласовываем стоимость до начала работ.</p>
          <Button asChild size="lg"><a href="#request">Оставить заявку<Arrow diagonal data-icon="inline-end" /></a></Button><p className="hero-note">Сначала диагностика. Затем ваше решение.</p>
        </div>
        <figure className="hero-media"><img src="./assets/repair-workbench.webp" width="1122" height="1402" fetchPriority="high" alt="Мастер аккуратно работает с внутренними компонентами ноутбука" /><figcaption>Внимание к деталям. Бережно к вашей технике.</figcaption></figure>
      </section>
      <section className="services container" id="services" aria-labelledby="services-title">
        <div className="section-heading"><h2 id="services-title">С чем поможем</h2><ToggleGroup type="single" value={category} onValueChange={value => { if (value === 'phone' || value === 'laptop') setCategory(value); }} aria-label="Категория устройства" spacing={2}><ToggleGroupItem value="phone">Смартфоны</ToggleGroupItem><ToggleGroupItem value="laptop">Ноутбуки</ToggleGroupItem></ToggleGroup></div>
        <div className="service-list" aria-live="polite">{services[category].map((service, i) => <button type="button" className="service-row" key={`${category}-${service.title}`} onClick={() => chooseService(service)} aria-label={`${service.title}, от ${service.price} рублей. Обсудить ремонт`}><span className="service-number">0{i + 1}</span><span className="service-text"><span className="service-title">{service.title}</span><span className="service-detail">{service.detail}</span></span><span className="service-price"><small>от </small>{service.price} ₽</span><Arrow /></button>)}</div><p className="price-note">Точная стоимость зависит от модели и результатов диагностики.</p>
      </section>
      <section className="process" id="process" aria-labelledby="process-title"><div className="container process-inner"><h2 id="process-title"><span>Понятный ремонт.</span><br />На каждом этапе.</h2><ol>{['Вы рассказываете о проблеме', 'Согласовываем решение и стоимость', 'Проверяем и возвращаем технику'].map((text, i) => <li key={text}><span>0{i + 1}</span><p>{text}</p></li>)}</ol></div></section>
      <section className="request-section container" id="request" aria-labelledby="request-title">
        <div className="request-copy"><h2 id="request-title">Расскажите,<br />что случилось.</h2><p>Опишите проблему — подскажем,<br className="desktop-break" /> с чего начать.</p></div>
        <div className="form-column">{submitted ? <section className="result-panel" aria-live="polite">
          <span className="success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg></span>
          <h3 tabIndex={-1} ref={successHeading}>Заявка отправлена</h3><p>Спасибо за обращение.</p>
          <div className="result-actions"><Button variant="outline" type="button" onClick={editRequest}>Вернуться к форме<Arrow data-icon="inline-end" /></Button></div>
        </section> : <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.name}><FieldLabel htmlFor="name">Ваше имя</FieldLabel><Input id="name" name="name" autoComplete="off" placeholder="Алексей" value={fields.name} onChange={event => update('name', event.target.value)} maxLength={60} required aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} />{fieldError('name')}</Field>
            <Field data-invalid={!!errors.phone}><FieldLabel htmlFor="phone">Телефон</FieldLabel><Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="off" placeholder="+7 (900) 000-00-00" value={fields.phone} onChange={event => update('phone', event.target.value)} maxLength={30} required aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : undefined} />{fieldError('phone')}</Field>
            <Field data-invalid={!!errors.device}><FieldLabel htmlFor="device">Устройство</FieldLabel><NativeSelect id="device" name="device" value={fields.device} onChange={event => update('device', event.target.value as Device)} aria-invalid={!!errors.device} aria-describedby={errors.device ? 'device-error' : undefined}><NativeSelectOption value="phone">Смартфон</NativeSelectOption><NativeSelectOption value="laptop">Ноутбук</NativeSelectOption><NativeSelectOption value="other">Другое устройство</NativeSelectOption></NativeSelect>{fieldError('device')}</Field>
            <Field data-invalid={!!errors.problem}><FieldLabel htmlFor="problem">Что случилось?</FieldLabel><Textarea id="problem" name="problem" placeholder="Модель устройства и описание проблемы" value={fields.problem} onChange={event => update('problem', event.target.value)} maxLength={1000} minLength={10} required rows={5} aria-invalid={!!errors.problem} aria-describedby={errors.problem ? 'problem-error' : undefined} />{fieldError('problem')}</Field>
            <Button type="submit" size="lg">Отправить заявку<span className="button-arrow"><Arrow data-icon="inline-end" /></span></Button>
          </FieldGroup>
        </form>}</div>
      </section>
      <section className="faq container" id="faq" aria-labelledby="faq-title"><h2 id="faq-title">Остались вопросы?</h2><Accordion type="single" collapsible>{faqs.map(([question, answer], i) => <AccordionItem value={String(i)} key={question}><AccordionTrigger>{question}</AccordionTrigger><AccordionContent>{answer}</AccordionContent></AccordionItem>)}</Accordion></section>
    </main>
    <footer className="site-footer container"><a className="wordmark" href="#main">контакт</a><p>Сайт разработан CodeRivento</p><a className="footer-link" href="./about/">О проекте<Arrow diagonal /></a></footer>
  </>;
}
