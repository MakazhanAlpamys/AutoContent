import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <h2>AutoContent</h2>
            <p>Автоматическое создание контента</p>
          </div>
          <div className="footer-links">
            <h3>Ссылки</h3>
            <ul>
              <li><a href="/">Главная</a></li>
              <li><a href="/upload">Создать видео</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} AutoContent. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 