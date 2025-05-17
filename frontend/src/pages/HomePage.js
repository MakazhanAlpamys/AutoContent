import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Автоматическое создание контента</h1>
          <p>Превращайте длинные видео в короткие яркие клипы с помощью искусственного интеллекта</p>
          <Link to="/upload" className="btn btn-lg">Создать видео</Link>
        </div>
      </section>

      <section className="features">
        <h2>Возможности платформы</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.6 11.6L22 7v10l-6.4-4.5v-1z"/><rect width="15" height="14" x="1" y="5" rx="2"/></svg>
            </div>
            <h3>Умная нарезка видео</h3>
            <p>ИИ автоматически находит самые яркие и интересные моменты в длинных видео</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <h3>Множественные клипы</h3>
            <p>Создание 3 коротких клипов из одного длинного видео</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06z"/><path d="M12 7c1-.56 2.78-2 5-2 .97 0 1.94.21 2.78.58"/></svg>
            </div>
            <h3>Генерация хэштегов</h3>
            <p>ИИ предложит релевантные хэштеги для каждого клипа</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3>Настраиваемая длительность</h3>
            <p>Выберите длительность клипов от 10 до 30 секунд</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>Как это работает</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Загрузите видео</h3>
            <p>Загрузите ваше видео в формате MP4 или MOV</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Выберите настройки</h3>
            <p>Укажите длительность и дополнительные опции</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Получите результат</h3>
            <p>Скачайте готовые клипы для публикации в социальных сетях</p>
          </div>
        </div>
        <div className="cta">
          <Link to="/upload" className="btn btn-lg">Начать сейчас</Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 