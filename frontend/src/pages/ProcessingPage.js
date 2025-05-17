import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProcessingPage.css';

const ProcessingPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);

  // Проверка статуса обработки
  useEffect(() => {
    let intervalId;
    
    const checkStatus = async () => {
      try {
        const response = await axios.get(`/api/status/${videoId}`);
        const { status, progress, error } = response.data;
        
        setStatus(status);
        if (progress !== undefined) {
          setProgress(progress);
        }
        
        if (error) {
          setError(error);
        }
        
        // Если обработка завершена, переходим на страницу результатов
        if (status === 'completed') {
          navigate(`/results/${videoId}`);
        }
      } catch (err) {
        console.error('Ошибка при получении статуса:', err);
        setError('Не удалось получить информацию о статусе обработки.');
      }
    };
    
    // Вызываем функцию сразу и затем регулярно проверяем статус
    checkStatus();
    intervalId = setInterval(checkStatus, 3000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [videoId, navigate]);

  // Предупреждение при попытке покинуть страницу во время обработки
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (status === 'processing') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  // Обработчик кнопки "Отмена"
  const handleCancel = () => {
    if (status === 'processing') {
      setIsLeaving(true);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="processing-page">
      <div className="processing-container">
        <h1>Обработка видео</h1>
        
        {status === 'processing' && (
          <>
            <div className="processing-animation">
              <div className="processing-icon">🎬</div>
            </div>
            <p className="processing-message">
              Пожалуйста, подождите. ИИ анализирует ваше видео и создает клипы...
            </p>
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="progress-text">{progress}% завершено</p>
            </div>
          </>
        )}
        
        {status === 'error' && (
          <div className="error-container">
            <div className="error-icon">❌</div>
            <h2>Произошла ошибка</h2>
            <p>{error || 'Не удалось обработать ваше видео. Пожалуйста, попробуйте еще раз.'}</p>
            <button 
              className="btn"
              onClick={() => navigate('/upload')}
            >
              Попробовать снова
            </button>
          </div>
        )}
        
        <div className="processing-actions">
          <button 
            className="btn btn-outline"
            onClick={handleCancel}
          >
            Отмена
          </button>
        </div>

        {/* Диалог подтверждения */}
        {isLeaving && (
          <div className="dialog-overlay">
            <div className="dialog">
              <h3>Предупреждение</h3>
              <p>Обработка видео в процессе. Если вы покинете страницу, процесс будет прерван и клипы не будут созданы.</p>
              <div className="dialog-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => setIsLeaving(false)}
                >
                  Остаться
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate('/')}
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingPage; 