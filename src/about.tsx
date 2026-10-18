import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import './styles/workshop.css';

function About() {
  return <main className="about-page container">
    <a className="wordmark" href="../">контакт</a>
    <h1>Сайт мастерской<br />«Контакт».</h1>
    <p className="about-lead">Проект CodeRivento: услуги, понятная навигация и удобная форма обращения.</p>
    <section><h2>Продумано для посетителя</h2><ul>
      <li>Адаптивная страница для компьютера и телефона.</li>
      <li>Каталог ремонта с выбором категории устройства.</li>
      <li>Заполнение услуги в форме по нажатию на карточку.</li>
      <li>Проверка полей и понятные сообщения об ошибках.</li>
    </ul></section>
    <a href="../#request" className="about-back">Вернуться на сайт →</a>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><About /></StrictMode>);
