import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import axios from 'axios';
import './UploadPage.css';

const UploadPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [settings, setSettings] = useState({
    duration: '15',
    hashtags: false,
    title: '',
    description: '',
    generateContentPlan: false
  });
  const [isLeavingPage, setIsLeavingPage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState({
    hashtags: [],
    contentPlan: []
  });

  // Обработчик для дропзоны
  const onDrop = useCallback(acceptedFiles => {
    const selectedFile = acceptedFiles[0];
    
    // Проверка типа файла
    const validTypes = ['video/mp4', 'video/quicktime'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Неверный формат файла. Пожалуйста, загрузите MP4 или MOV видео.');
      return;
    }
    
    // Проверка размера файла (макс. 500MB)
    if (selectedFile.size > 500 * 1024 * 1024) {
      toast.error('Файл слишком большой. Максимальный размер - 500MB.');
      return;
    }
    
    setFile(selectedFile);
  }, []);
  
  // Настройка дропзоны
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov']
    },
    maxFiles: 1
  });

  // Обработчики изменения настроек
  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Предварительный просмотр AI-контента
  const handlePreview = () => {
    if (!settings.title.trim()) {
      toast.error('Пожалуйста, введите название видео');
      return;
    }

    if (!settings.description.trim()) {
      toast.error('Пожалуйста, введите описание видео');
      return;
    }

    // Здесь будет вызов AI API для генерации контента
    // Сейчас используем имитацию для демонстрации
    
    // Генерация хэштегов на основе названия и описания
    const simulateHashtags = () => {
      const keywords = [...settings.title.split(' '), ...settings.description.split(' ')]
        .filter(word => word.length > 3)
        .map(word => word.toLowerCase())
        .slice(0, 10);
      
      const popularTags = ['#видео', '#контент', '#креатив', '#тренды', '#монтаж'];
      
      // Создаем хэштеги из ключевых слов
      const contentTags = [...new Set(keywords)]
        .slice(0, 5)
        .map(word => `#${word.replace(/[^\w\sа-яА-Я]/g, '')}`);
      
      return [...popularTags.slice(0, 3), ...contentTags].slice(0, 8);
    };
    
    // Генерация простого контент-плана
    const simulateContentPlan = () => {
      const today = new Date();
      const contentPlan = [];
      
      for (let i = 0; i < 4; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + i * 2);
        
        const formatDate = (date) => {
          return date.toLocaleDateString('ru-RU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        };
        
        const ideas = [
          `Основной ролик по теме "${settings.title}"`,
          `Нарезка лучших моментов из "${settings.title}"`,
          `Обсуждение ключевых идей из "${settings.title}"`,
          `Ответы на комментарии к "${settings.title}"`,
          `Закулисье съемок "${settings.title}"`,
          `Расширенное объяснение концепции "${settings.title}"`
        ];
        
        contentPlan.push({
          date: formatDate(futureDate),
          content: ideas[i % ideas.length]
        });
      }
      
      return contentPlan;
    };
    
    const generatedHashtags = simulateHashtags();
    const generatedContentPlan = settings.generateContentPlan ? simulateContentPlan() : [];
    
    setAiGeneratedContent({
      hashtags: generatedHashtags,
      contentPlan: generatedContentPlan
    });
    
    setShowPreview(true);
  };

  // Предупреждение при попытке покинуть страницу во время загрузки
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isUploading]);

  // Обработчик загрузки файла
  const handleUpload = async () => {
    if (!file) {
      toast.error('Пожалуйста, выберите видео для загрузки.');
      return;
    }

    if (!settings.title.trim()) {
      toast.error('Пожалуйста, введите название видео');
      return;
    }

    if (!settings.description.trim()) {
      toast.error('Пожалуйста, введите описание видео');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('video', file);
    formData.append('duration', settings.duration);
    formData.append('hashtags', settings.hashtags);
    formData.append('title', settings.title);
    formData.append('description', settings.description);
    formData.append('generateContentPlan', settings.generateContentPlan);
    
    // Если был предпросмотр, добавляем уже сгенерированный контент
    if (showPreview) {
      formData.append('aiGeneratedHashtags', JSON.stringify(aiGeneratedContent.hashtags));
      formData.append('aiGeneratedContentPlan', JSON.stringify(aiGeneratedContent.contentPlan));
    }
    
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      
      setIsUploading(false);
      
      // Переход на страницу обработки
      const { videoId } = response.data;
      navigate(`/processing/${videoId}`);
    } catch (error) {
      setIsUploading(false);
      toast.error('Ошибка при загрузке видео. Пожалуйста, попробуйте еще раз.');
      console.error('Ошибка загрузки:', error);
    }
  };

  // Диалог подтверждения при попытке уйти во время загрузки
  const handleLeavePage = () => {
    if (isUploading) {
      setIsLeavingPage(true);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="upload-page">
      <h1>Загрузка видео</h1>
      
      {/* Дропзона для загрузки файла */}
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="file-info">
            <p className="file-name">{file.name}</p>
            <p className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <button 
              className="btn btn-sm btn-outline change-file"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
            >
              Изменить
            </button>
          </div>
        ) : (
          <div className="dropzone-content">
            <div className="dropzone-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><path d="M13 2v7h7"></path><path d="M12 18v-6"></path><path d="M9 15h6"></path></svg>
            </div>
            <p>Перетащите видео сюда или кликните для выбора</p>
            <span className="dropzone-hint">Поддерживаемые форматы: MP4, MOV (до 500MB)</span>
          </div>
        )}
      </div>
      
      {/* Информация о видео */}
      <div className="settings-container">
        <h2>Информация о видео</h2>
        
        <div className="form-group">
          <label className="form-label" htmlFor="title">Название видео</label>
          <input
            type="text"
            id="title"
            name="title"
            value={settings.title}
            onChange={handleSettingChange}
            className="form-control"
            placeholder="Введите название видео"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="description">Описание видео</label>
          <textarea
            id="description"
            name="description"
            value={settings.description}
            onChange={handleSettingChange}
            className="form-control"
            rows="4"
            placeholder="Опишите содержание видео подробнее"
          ></textarea>
        </div>
      </div>
      
      {/* Настройки видео */}
      <div className="settings-container">
        <h2>Настройки</h2>
        
        <div className="form-group">
          <label className="form-label" htmlFor="duration">
            Длительность клипов (секунды): {settings.duration}
          </label>
          <input
            type="range"
            id="duration"
            name="duration"
            min="10"
            max="30"
            step="1"
            value={settings.duration}
            onChange={handleSettingChange}
            className="range-slider"
          />
          <div className="range-labels">
            <span>10 сек</span>
            <span>30 сек</span>
          </div>
        </div>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="hashtags"
              checked={settings.hashtags}
              onChange={handleSettingChange}
            />
            <span>Сгенерировать хэштеги</span>
          </label>
        </div>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="generateContentPlan"
              checked={settings.generateContentPlan}
              onChange={handleSettingChange}
            />
            <span>Сгенерировать контент-план</span>
          </label>
        </div>
      </div>
      
      {/* Предпросмотр AI-контента */}
      {showPreview && (
        <div className="settings-container ai-preview">
          <h2>Контент от ИИ</h2>
          
          {aiGeneratedContent.hashtags.length > 0 && (
            <div className="ai-content-section">
              <h3>Хэштеги</h3>
              <div className="hashtags-container">
                {aiGeneratedContent.hashtags.map((tag, index) => (
                  <span key={index} className="hashtag">{tag}</span>
                ))}
              </div>
            </div>
          )}
          
          {aiGeneratedContent.contentPlan.length > 0 && (
            <div className="ai-content-section">
              <h3>Предлагаемый контент-план</h3>
              <div className="content-plan">
                {aiGeneratedContent.contentPlan.map((item, index) => (
                  <div key={index} className="content-plan-item">
                    <div className="content-plan-date">{item.date}</div>
                    <div className="content-plan-content">{item.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Кнопки */}
      <div className="upload-actions">
        <button 
          className="btn btn-outline"
          onClick={handleLeavePage}
          disabled={isUploading}
        >
          Отмена
        </button>
        
        {!showPreview && settings.title && settings.description && (
          <button 
            className="btn btn-secondary"
            onClick={handlePreview}
            disabled={isUploading}
          >
            Предпросмотр ИИ
          </button>
        )}
        
        <button 
          className="btn"
          onClick={handleUpload}
          disabled={!file || isUploading || !settings.title || !settings.description}
        >
          {isUploading ? 'Загрузка...' : 'Загрузить видео'}
        </button>
      </div>
      
      {/* Прогресс загрузки */}
      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p>{uploadProgress}% загружено</p>
        </div>
      )}
      
      {/* Диалог подтверждения */}
      {isLeavingPage && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Предупреждение</h3>
            <p>Загрузка видео в процессе. Если вы покинете страницу, процесс будет прерван.</p>
            <div className="dialog-actions">
              <button 
                className="btn btn-outline"
                onClick={() => setIsLeavingPage(false)}
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
  );
};

export default UploadPage; 