
### Шаги установки

1. Клонируйте репозиторий:
   ```bash
   git clone [URL-репозитория]
   cd autocontent
   ```

2. Установите все зависимости:
   ```bash
   cd backend
   npm install

   cd frontend (на другом терминале)
   npm install
   ```
   Эта команда установит зависимости для корневого проекта, фронтенда и бэкенда.

3. в файле AutoContent\backend\config.js
обязательно измените путь к файлам(это путь на файлы в моем проводнике):
  ffmpegPath: "C:\\Users\\tokmo\\Downloads\\ffmpeg-master-latest-win64-gpl-shared\\ffmpeg-master-latest-win64-gpl-shared\\bin\\ffmpeg.exe",
  ffprobePath: "C:\\Users\\tokmo\\Downloads\\ffmpeg-master-latest-win64-gpl-shared\\ffmpeg-master-latest-win64-gpl-shared\\bin\\ffprobe.exe"


3. Запустите проект:
   ```bash
   npm start (для бэкенда и фронтенда)
   ```
   Эта команда запустит и фронтенд (на порту 3000), и бэкенд (на порту 5000) серверы одновременно.

4. Откройте браузер и перейдите по адресу:
   ```
   http://localhost:3000
   ```
