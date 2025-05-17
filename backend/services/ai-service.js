const axios = require('axios');
const config = require('../config');

/**
 * Сервис для взаимодействия с Gemini AI API
 */
class AIService {
  /**
   * Генерация хэштегов на основе названия и описания видео
   * @param {string} title - Название видео
   * @param {string} description - Описание видео
   * @returns {Promise<string[]>} - Массив хэштегов
   */
  async generateHashtags(title, description) {
    try {
      const prompt = `Ты - помощник по созданию контента. 
      Сгенерируй 8 релевантных хэштегов для видео на основе его названия и описания. 
      Хэштеги должны быть на русском языке и начинаться с символа #. 
      Не используй пробелы в хэштегах. 
      
      Название видео: "${title}"
      Описание видео: "${description}"
      
      Верни ТОЛЬКО массив хэштегов, без дополнительного текста.`;

      const aiResponse = await this.callGeminiAPI(prompt);
      
      // Извлекаем хэштеги из ответа
      const hashtags = this.parseHashtagsFromResponse(aiResponse);
      
      return hashtags.length > 0 ? hashtags : this.getFallbackHashtags(title, description);
    } catch (error) {
      console.error('Ошибка при генерации хэштегов:', error);
      return this.getFallbackHashtags(title, description);
    }
  }
  
  /**
   * Генерация контент-плана на основе названия и описания видео
   * @param {string} title - Название видео
   * @param {string} description - Описание видео
   * @returns {Promise<Array<{date: string, content: string}>>} - Массив элементов контент-плана
   */
  async generateContentPlan(title, description) {
    try {
      const today = new Date();
      
      const prompt = `Ты - помощник по созданию контента.
      Создай контент-план на основе названия и описания видео.
      План должен содержать 4 идеи для создания контента с указанием дат (начиная с сегодняшней даты: ${today.toLocaleDateString('ru-RU')}).
      Каждая идея должна быть связана с темой видео и содержать конкретное предложение для создания контента.
      
      Название видео: "${title}"
      Описание видео: "${description}"
      
      Верни результат в формате массива объектов JSON, где каждый объект содержит поля 'date' (дата в формате ДД месяц ГГГГ) и 'content' (описание контента).
      Не добавляй никакого дополнительного текста или пояснений.`;

      const aiResponse = await this.callGeminiAPI(prompt);
      
      // Извлекаем контент-план из ответа
      const contentPlan = this.parseContentPlanFromResponse(aiResponse);
      
      return contentPlan.length > 0 ? contentPlan : this.getFallbackContentPlan(title);
    } catch (error) {
      console.error('Ошибка при генерации контент-плана:', error);
      return this.getFallbackContentPlan(title);
    }
  }
  
  /**
   * Вызов Gemini API
   * @param {string} prompt - Запрос для API
   * @returns {Promise<string>} - Ответ от API
   */
  async callGeminiAPI(prompt) {
    try {
      // Проверяем, установлен ли API ключ
      if (!config.geminiApiKey || config.geminiApiKey === "YOUR_GEMINI_API_KEY_HERE") {
        throw new Error('API ключ не настроен');
      }
      
      const response = await axios.post(
        `${config.geminiApiEndpoint}?key=${config.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }
      );
      
      if (response.data && 
          response.data.candidates && 
          response.data.candidates[0] && 
          response.data.candidates[0].content &&
          response.data.candidates[0].content.parts &&
          response.data.candidates[0].content.parts[0] &&
          response.data.candidates[0].content.parts[0].text) {
        return response.data.candidates[0].content.parts[0].text;
      }
      
      throw new Error('Неожиданный формат ответа от API');
    } catch (error) {
      console.error('Ошибка при вызове Gemini API:', error.message);
      throw error;
    }
  }
  
  /**
   * Извлечение хэштегов из ответа AI
   * @param {string} response - Ответ от AI
   * @returns {string[]} - Массив хэштегов
   */
  parseHashtagsFromResponse(response) {
    try {
      // Пробуем извлечь массив JSON, если AI вернул его
      if (response.includes('[') && response.includes(']')) {
        const jsonMatch = response.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const hashtags = JSON.parse(jsonStr);
          if (Array.isArray(hashtags) && hashtags.every(tag => typeof tag === 'string')) {
            return hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`);
          }
        }
      }
      
      // Альтернативный подход - ищем хэштеги в тексте
      const hashtagRegex = /#[\wа-яА-Я]+/g;
      const matches = response.match(hashtagRegex);
      if (matches && matches.length > 0) {
        return [...new Set(matches)]; // Удаление дубликатов
      }
      
      // Разбиваем текст на строки и ищем хэштеги
      const lines = response.split('\n').map(line => line.trim());
      const hashtags = lines
        .filter(line => line.startsWith('#') || line.includes('#'))
        .map(line => {
          // Извлекаем хэштег из строки
          const match = line.match(/#[\wа-яА-Я]+/);
          return match ? match[0] : null;
        })
        .filter(Boolean);
      
      return [...new Set(hashtags)]; // Удаление дубликатов
    } catch (error) {
      console.error('Ошибка при обработке хэштегов:', error);
      return [];
    }
  }
  
  /**
   * Извлечение контент-плана из ответа AI
   * @param {string} response - Ответ от AI
   * @returns {Array<{date: string, content: string}>} - Массив элементов контент-плана
   */
  parseContentPlanFromResponse(response) {
    try {
      // Пробуем извлечь массив JSON, если AI вернул его
      if (response.includes('[') && response.includes(']')) {
        const jsonMatch = response.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const contentPlan = JSON.parse(jsonStr);
          if (Array.isArray(contentPlan) && 
              contentPlan.every(item => item.date && item.content)) {
            return contentPlan;
          }
        }
      }
      
      // В случае неудачи парсинга JSON, пробуем извлечь структурированные данные из текста
      const contentPlan = [];
      const lines = response.split('\n');
      
      let currentDate = '';
      let currentContent = '';
      
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Ищем даты в формате DD.MM.YYYY или похожие
        const dateMatch = line.match(/\d{1,2}[\s.][а-яА-Я]+[\s.]\d{4}/);
        if (dateMatch) {
          // Если у нас есть предыдущая дата и контент, добавляем их в план
          if (currentDate && currentContent) {
            contentPlan.push({ date: currentDate, content: currentContent });
            currentContent = '';
          }
          
          currentDate = dateMatch[0];
          
          // Извлекаем контент, если он есть в той же строке
          const contentAfterDate = line.substring(dateMatch.index + dateMatch[0].length).trim();
          if (contentAfterDate && contentAfterDate.length > 5) {
            currentContent = contentAfterDate;
            contentPlan.push({ date: currentDate, content: currentContent });
            currentDate = '';
            currentContent = '';
          }
        } else if (currentDate && line.length > 5) {
          // Если у нас уже есть дата, то это, вероятно, контент
          currentContent = line;
          contentPlan.push({ date: currentDate, content: currentContent });
          currentDate = '';
          currentContent = '';
        }
      }
      
      // Добавляем последнюю запись, если она есть
      if (currentDate && currentContent) {
        contentPlan.push({ date: currentDate, content: currentContent });
      }
      
      return contentPlan;
    } catch (error) {
      console.error('Ошибка при обработке контент-плана:', error);
      return [];
    }
  }
  
  /**
   * Резервные хэштеги, если AI не смог сгенерировать
   * @param {string} title - Название видео
   * @param {string} description - Описание видео
   * @returns {string[]} - Массив хэштегов
   */
  getFallbackHashtags(title, description) {
    const commonTags = ['#видео', '#контент', '#тренды', '#креатив', '#монтаж'];
    
    // Извлекаем ключевые слова из названия и описания
    const content = `${title} ${description}`;
    const words = content.split(/\s+/)
      .filter(word => word.length > 3)
      .map(word => word.toLowerCase())
      .filter(word => !['что', 'как', 'для', 'при', 'это', 'там', 'тут'].includes(word));
    
    // Создаем хэштеги из ключевых слов
    const contentTags = [...new Set(words)]
      .slice(0, 5)
      .map(word => `#${word.replace(/[^\wа-яА-Я]/g, '')}`);
    
    return [...commonTags.slice(0, 3), ...contentTags].slice(0, 8);
  }
  
  /**
   * Резервный контент-план, если AI не смог сгенерировать
   * @param {string} title - Название видео
   * @returns {Array<{date: string, content: string}>} - Массив элементов контент-плана
   */
  getFallbackContentPlan(title) {
    const today = new Date();
    const contentPlan = [];
    
    const ideas = [
      `Основной ролик по теме "${title}"`,
      `Нарезка лучших моментов из "${title}"`,
      `Обсуждение ключевых идей из "${title}"`,
      `Ответы на комментарии к "${title}"`
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
}

module.exports = new AIService(); 