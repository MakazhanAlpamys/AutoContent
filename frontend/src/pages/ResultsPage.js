import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ResultsPage.css';

const ResultsPage = () => {
  const { videoId } = useParams();
  const [clips, setClips] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClips = async () => {
      try {
        const response = await axios.get(`/api/clips/${videoId}`);
        setClips(response.data.clips || []);
        setMetadata(response.data.metadata || {});
        setLoading(false);
      } catch (err) {
        console.error('Ошибка при получении клипов:', err);
        setError('Не удалось загрузить созданные клипы.');
        setLoading(false);
      }
    };

    fetchClips();
  }, [videoId]);

  const handleDownload = (clipUrl) => {
    window.open(clipUrl, '_blank');
  };

  return (
    <div className="results-page">
      <div className="results-header">
        <h1>Готовые клипы</h1>
        <p>ИИ создал для вас следующие клипы на основе вашего видео:</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка клипов...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-icon">❌</div>
          <p>{error}</p>
          <Link to="/upload" className="btn">
            Загрузить новое видео
          </Link>
        </div>
      ) : clips.length === 0 ? (
        <div className="empty-container">
          <div className="empty-icon">📭</div>
          <p>Клипы не найдены. Возможно, произошла ошибка при обработке.</p>
          <Link to="/upload" className="btn">
            Загрузить новое видео
          </Link>
        </div>
      ) : (
        <>
          {/* Секция информации о видео */}
          <div className="video-info-container">
            <h2>Информация о видео</h2>
            <div className="video-info-card">
              <div className="video-info-section">
                <h3>Название видео</h3>
                <p>{metadata.title || 'Без названия'}</p>
              </div>
              
              <div className="video-info-section">
                <h3>Описание видео</h3>
                <p>{metadata.description || 'Без описания'}</p>
              </div>
              
              {metadata.hashtags && metadata.hashtags.length > 0 && (
                <div className="video-info-section">
                  <h3>Сгенерированные хэштеги</h3>
                  <div className="hashtags-container">
                    {metadata.hashtags.map((tag, index) => (
                      <span key={index} className="hashtag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {metadata.contentPlan && metadata.contentPlan.length > 0 && (
                <div className="video-info-section">
                  <h3>Контент план</h3>
                  <div className="content-plan">
                    {metadata.contentPlan.map((item, index) => (
                      <div key={index} className="content-plan-item">
                        <div className="content-plan-date">{item.date}</div>
                        <div className="content-plan-content">{item.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Секция с клипами */}
          <div className="clips-container">
            {clips.map((clipUrl, index) => (
              <div className="clip-card" key={index}>
                <div className="clip-number">Клип {index + 1}</div>
                <div className="clip-preview">
                  <video controls>
                    <source src={clipUrl} type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                </div>
                <div className="clip-actions">
                  <button 
                    className="btn"
                    onClick={() => handleDownload(clipUrl)}
                  >
                    Скачать
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="results-footer">
        <p>Понравился результат? Загрузите еще видео, чтобы создать больше клипов!</p>
        <Link to="/upload" className="btn btn-lg">
          Создать новые клипы
        </Link>
      </div>
    </div>
  );
};

export default ResultsPage;
