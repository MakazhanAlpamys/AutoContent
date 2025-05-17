import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link to="/" className="logo-link" title="На главную">
            <h1>AutoContent</h1>
          </Link>
        </div>
        <nav className="nav">
          <ul>
            <li>
              <Link to="/">Главная</Link>
            </li>
            <li>
              <Link to="/upload" className="btn btn-sm">Создать видео</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 