# Книжная Вселенная — Мобильное приложение

Мобильная SPA (Single Page Application) для поиска книжных клубов, событий и подбора клуба по вкусу.

## Стек

- **Vite** — сборщик
- **Vanilla JS** — без фреймворков
- **CSS** — кастомный, без библиотек

## Структура

```
book-club-mobile/
├── public/          # Статические файлы (логотипы клубов)
├── src/
│   ├── main.js      # Точка входа, роутинг вкладок
│   ├── style.css    # Стили
│   └── modules/
│       ├── clubs.js   # Вкладка «Клубы»
│       ├── events.js  # Вкладка «События»
│       ├── quiz.js    # Вкладка «Подобрать»
│       └── search.js  # Вкладка «Найти»
├── index.html
├── vite.config.js
└── dist/            # Собранная версия (не в git)
```

## Данные

Приложение использует общую базу данных из `../book-club-universe/src/data/db.js`.  
При сборке (`npm run build`) данные **встраиваются в бандл** — хостинг не требует соседнего репозитория.

## Разработка

```bash
npm install
npm run dev        # http://localhost:5180
```

> ⚠️ Для разработки нужен соседний репозиторий `book-club-universe/` с актуальным `db.js`.

## Сборка и деплой

```bash
npm run build      # Создаёт папку dist/
```

Содержимое папки `dist/` загружать на хостинг (Netlify, Vercel, GitHub Pages, etc.).

### Netlify

1. Drag & drop папки `dist/` на [netlify.com/drop](https://app.netlify.com/drop)  
   **или**
2. Подключить репозиторий:
   - Build command: `npm run build`
   - Publish directory: `dist`

### GitHub Pages (через Actions)

Добавить в `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Обновление данных

Все данные хранятся в [`book-club-universe/src/data/db.js`](../book-club-universe/src/data/db.js).  
После изменений — пересобрать: `npm run build`.
