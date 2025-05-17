const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const natural = require('natural');
const config = require('./config');
const aiService = require('./services/ai-service');

// Устанавливаем пути к ffmpeg и ffprobe из конфигурации
ffmpeg.setFfmpegPath(config.ffmpegPath);
ffmpeg.setFfprobePath(config.ffprobePath);

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());

// Создаем директории для хранения
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(outputDir);

// Настройка хранилища для multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Проверка типа файла
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.mp4', '.mov'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый формат файла. Разрешены только MP4 и MOV.'));
  }
};

// Создаем загрузчик
const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 500 } // 500 MB максимум
});

// API для загрузки видео
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Видео не было загружено' });
    }

    const videoPath = req.file.path;
    const { 
      duration, 
      hashtags, 
      title, 
      description, 
      generateContentPlan,
      aiGeneratedHashtags,
      aiGeneratedContentPlan
    } = req.body;
    
    // Отправляем информацию о принятом видео
    res.status(200).json({
      message: 'Видео успешно загружено',
      videoId: path.basename(videoPath, path.extname(videoPath)),
      settings: { 
        duration, 
        hashtags, 
        title, 
        description,
        generateContentPlan 
      }
    });
    
    // Разбираем предварительно сгенерированный AI-контент
    let parsedHashtags = [];
    let parsedContentPlan = [];
    
    try {
      if (aiGeneratedHashtags) {
        parsedHashtags = JSON.parse(aiGeneratedHashtags);
      }
      
      if (aiGeneratedContentPlan) {
        parsedContentPlan = JSON.parse(aiGeneratedContentPlan);
      }
    } catch (error) {
      console.error('Ошибка при парсинге AI-контента:', error);
    }
    
    // Запускаем процесс обработки асинхронно
    processVideo(
      videoPath, 
      duration, 
      hashtags === 'true', 
      title, 
      description, 
      generateContentPlan === 'true',
      parsedHashtags,
      parsedContentPlan
    );
  } catch (error) {
    console.error('Ошибка при загрузке видео:', error);
    res.status(500).json({ error: 'Ошибка при загрузке видео' });
  }
});

// API для проверки состояния обработки
app.get('/api/status/:videoId', (req, res) => {
  const { videoId } = req.params;
  const statusPath = path.join(outputDir, `${videoId}_status.json`);
  
  try {
    if (fs.existsSync(statusPath)) {
      const status = fs.readJsonSync(statusPath);
      res.json(status);
    } else {
      res.json({ status: 'processing', progress: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении статуса' });
  }
});

// API для получения созданных клипов
app.get('/api/clips/:videoId', (req, res) => {
  const { videoId } = req.params;
  const videoDir = path.join(outputDir, videoId);
  
  try {
    if (fs.existsSync(videoDir)) {
      const files = fs.readdirSync(videoDir)
        .filter(file => file.endsWith('.mp4'))
        .map(file => `/api/download/${videoId}/${file}`);
      
      // Получаем метаданные и дополнительный контент
      const metadata = {};
      const contentPath = path.join(videoDir, 'metadata.json');
      if (fs.existsSync(contentPath)) {
        Object.assign(metadata, fs.readJsonSync(contentPath));
      }
      
      // Получаем хэштеги, если они есть
      const hashtagsPath = path.join(videoDir, 'hashtags.json');
      if (fs.existsSync(hashtagsPath)) {
        const hashtagsData = fs.readJsonSync(hashtagsPath);
        metadata.hashtags = hashtagsData.hashtags;
      }
      
      // Получаем контент-план, если он есть
      const contentPlanPath = path.join(videoDir, 'content_plan.json');
      if (fs.existsSync(contentPlanPath)) {
        const contentPlanData = fs.readJsonSync(contentPlanPath);
        metadata.contentPlan = contentPlanData.contentPlan;
      }
      
      res.json({ 
        clips: files,
        metadata
      });
    } else {
      res.status(404).json({ error: 'Клипы не найдены' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении клипов' });
  }
});

// API для скачивания созданных клипов
app.get('/api/download/:videoId/:filename', (req, res) => {
  const { videoId, filename } = req.params;
  const filePath = path.join(outputDir, videoId, filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'Файл не найден' });
  }
});

// Функция обработки видео с использованием ИИ
async function processVideo(
  videoPath, 
  clipDuration, 
  addHashtags, 
  title, 
  description, 
  generateContentPlan,
  preGeneratedHashtags = [],
  preGeneratedContentPlan = []
) {
  const videoId = path.basename(videoPath, path.extname(videoPath));
  const videoDir = path.join(outputDir, videoId);
  fs.ensureDirSync(videoDir);
  
  // Создаем файл статуса
  const statusPath = path.join(outputDir, `${videoId}_status.json`);
  fs.writeJsonSync(statusPath, { status: 'processing', progress: 0 });
  
  // Сохраняем метаданные видео
  const metadataPath = path.join(videoDir, 'metadata.json');
  fs.writeJsonSync(metadataPath, {
    title,
    description,
    uploadDate: new Date().toISOString()
  });
  
  try {
    // Получаем информацию о видео
    const videoInfo = await getVideoInfo(videoPath);
    
    // Находим интересные моменты (ИИ-часть)
    const highlights = await findHighlights(videoPath, videoInfo, parseInt(clipDuration, 10));
    
    // Устанавливаем статус 10%
    fs.writeJsonSync(statusPath, { status: 'processing', progress: 10 });
    
    // Генерируем хэштеги если нужно
    let hashtags = [];
    if (addHashtags) {
      // Используем уже сгенерированные хэштеги или генерируем новые через AI
      if (preGeneratedHashtags.length > 0) {
        hashtags = preGeneratedHashtags;
        console.log('Используем предварительно сгенерированные хэштеги');
      } else {
        try {
          console.log('Генерация хэштегов через Gemini AI...');
          hashtags = await aiService.generateHashtags(title, description);
        } catch (error) {
          console.error('Ошибка при генерации хэштегов через API:', error);
          // Используем локальную генерацию как запасной вариант
          hashtags = generateHashtags(title, description);
        }
      }
      
      // Сохраняем хэштеги
      const hashtagsPath = path.join(videoDir, 'hashtags.json');
      fs.writeJsonSync(hashtagsPath, { hashtags });
    }
    
    // Устанавливаем статус 20%
    fs.writeJsonSync(statusPath, { status: 'processing', progress: 20 });
    
    // Генерируем контент-план если нужно
    if (generateContentPlan) {
      let contentPlan = [];
      
      // Используем уже сгенерированный контент-план или генерируем новый через AI
      if (preGeneratedContentPlan.length > 0) {
        contentPlan = preGeneratedContentPlan;
        console.log('Используем предварительно сгенерированный контент-план');
      } else {
        try {
          console.log('Генерация контент-плана через Gemini AI...');
          contentPlan = await aiService.generateContentPlan(title, description);
        } catch (error) {
          console.error('Ошибка при генерации контент-плана через API:', error);
          // Используем локальную генерацию как запасной вариант
          contentPlan = generateContentPlanAI(title, description);
        }
      }
      
      // Сохраняем контент-план
      const contentPlanPath = path.join(videoDir, 'content_plan.json');
      fs.writeJsonSync(contentPlanPath, { contentPlan });
    }
    
    // Устанавливаем статус 30%
    fs.writeJsonSync(statusPath, { status: 'processing', progress: 30 });
    
    // Создаем клипы
    for (let i = 0; i < Math.min(highlights.length, 3); i++) {
      const highlight = highlights[i];
      const outputPath = path.join(videoDir, `clip_${i+1}.mp4`);
      
      // Обновляем статус
      fs.writeJsonSync(statusPath, { 
        status: 'processing', 
        progress: 30 + Math.round((i / 3) * 70) 
      });
      
      // Создаем клип
      await createClip(
        videoPath, 
        outputPath, 
        highlight.start, 
        highlight.duration
      );
      
      // Добавляем хэштеги для каждого клипа, если нужно
      if (addHashtags) {
        const clipHashtagsPath = path.join(videoDir, `clip_${i+1}_hashtags.txt`);
        fs.writeFileSync(clipHashtagsPath, hashtags.join(' '));
      }
    }
    
    // Обновляем статус по завершении
    fs.writeJsonSync(statusPath, { status: 'completed', progress: 100 });
  } catch (error) {
    console.error('Ошибка при обработке видео:', error);
    fs.writeJsonSync(statusPath, { status: 'error', error: error.message });
  }
}

// Получение информации о видео
function getVideoInfo(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      
      const { duration, width, height } = metadata.format;
      resolve({
        duration,
        width,
        height,
        aspectRatio: width / height
      });
    });
  });
}

// Имитация ИИ-анализа для поиска интересных моментов
async function findHighlights(videoPath, videoInfo, clipDuration) {
  // В реальном проекте здесь был бы анализ с помощью ИИ
  // Сейчас используем эвристический подход для демонстрации
  
  const totalDuration = videoInfo.duration;
  const highlights = [];
  
  // Разделяем видео на сегменты и анализируем изменения в каждом
  const segmentCount = Math.min(10, Math.floor(totalDuration / 5));
  
  for (let i = 0; i < segmentCount; i++) {
    const segmentStart = (i * totalDuration) / segmentCount;
    
    // Определяем "интересность" сегмента (в реальности, это делает ИИ)
    const interestScore = Math.random(); // Имитация оценки ИИ
    
    if (interestScore > 0.5) { // Порог интересности
      highlights.push({
        start: segmentStart,
        duration: Math.min(clipDuration, 30), // Максимум 30 секунд
        score: interestScore,
        content: `Интересный момент ${i+1}`
      });
    }
  }
  
  // Сортируем по "интересности" и берем лучшие
  return highlights
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// Создание клипа
function createClip(inputPath, outputPath, startTime, duration) {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .setStartTime(startTime)
      .duration(duration)
      .outputOptions('-c:v libx264')
      .outputOptions('-c:a aac')
      .outputOptions('-vf scale=1280:720'); // Используем стандартный размер 16:9
    
    command.output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

// Генерация хэштегов на основе названия и описания
function generateHashtags(title, description) {
  const tokenizer = new natural.WordTokenizer();
  const content = `${title} ${description}`;
  
  const words = tokenizer.tokenize(content) || ['видео', 'контент', 'автоматизация'];
  
  // Выбираем наиболее релевантные слова для хэштегов
  const relevantWords = words
    .filter(word => word.length > 3)
    .map(word => word.toLowerCase())
    .filter(word => !['что', 'как', 'для', 'при', 'это', 'там', 'тут'].includes(word));
  
  // Создаем хэштеги
  const hashtags = [];
  const commonTags = ['#контент', '#видео', '#тренды', '#креатив', '#монтаж'];
  
  // Добавляем базовые хэштеги
  hashtags.push(...commonTags.slice(0, 3));
  
  // Добавляем хэштеги из контента
  [...new Set(relevantWords)].forEach((word, index) => {
    if (index < 5) {
      hashtags.push(`#${word.replace(/[^\wа-яА-Я]/g, '')}`);
    }
  });
  
  return [...new Set(hashtags)].slice(0, 8);
}

// Генерация контент-плана на основе названия и описания
function generateContentPlanAI(title, description) {
  // Функция-заглушка вместо вызова AI API
  const today = new Date();
  const contentPlan = [];
  
  const ideas = [
    `Основной ролик по теме "${title}"`,
    `Нарезка лучших моментов из "${title}"`,
    `Обсуждение ключевых идей из "${title}"`,
    `Ответы на комментарии к "${title}"`,
    `Закулисье съемок "${title}"`,
    `Расширенное объяснение концепции "${title}"`,
    `Интервью с экспертами о теме "${title}"`,
    `Сравнение разных подходов к теме "${title}"`
  ];
  
  for (let i = 0; i < 4; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i * 3);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('ru-RU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    contentPlan.push({
      date: formatDate(futureDate),
      content: ideas[i % ideas.length]
    });
  }
  
  return contentPlan;
}

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  
  // Проверка настройки API ключа
  if (!config.geminiApiKey || config.geminiApiKey === "YOUR_GEMINI_API_KEY_HERE") {
    console.warn('⚠️ Предупреждение: API ключ Gemini не настроен. Функции ИИ будут работать в режиме эмуляции.');
    console.info('✏️ Для настройки API ключа отредактируйте файл config.js');
  } else {
    console.log('✅ API ключ Gemini настроен. Функции ИИ будут работать в полном режиме.');
  }
}); 