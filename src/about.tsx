import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import './styles/workshop.css';

function About() {
  return <main className="about-page container">
    <a className="wordmark" href="../">контакт</a>
    <h1>Сайт мастерской<br />«Контакт».</h1>
    <p className="about-lead">Проект CodeRivento: сайт мастерской и CRM, которая связывает заявки, клиентов и этапы ремонта.</p>
    <section><h2>Продумано для посетителя</h2><ul>
      <li>Адаптивная страница для компьютера и телефона.</li>
      <li>Каталог ремонта с выбором категории устройства.</li>
      <li>Заполнение услуги в форме по нажатию на карточку.</li>
      <li>Проверка полей и понятные сообщения об ошибках.</li>
      <li>Доска ремонтов, карточки клиентов, история и архив.</li>
      <li>Заявки с сайта появляются в CRM в этом же браузере.</li>
    </ul></section>
    <a href="../crm/" className="about-back">Открыть CRM →</a><br />
    <a href="../#request" className="about-back">Вернуться на сайт →</a>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><About /></StrictMode>);
