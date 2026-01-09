# TaskFlow

Современный task-менеджер для команд — упрощённый аналог Linear/Trello с Kanban-доской и аналитикой.

**[Live Demo](https://taskmanager-lac-ten.vercel.app/)**

## Возможности

- **Аутентификация** — регистрация, вход, защищённые роуты
- **Проекты** — создание, управление участниками, приглашения по email и публичные ссылки
- **Задачи** — название, описание, исполнитель, дедлайн, приоритет (Low/Medium/High/Urgent)
- **Kanban-доска** — 4 колонки (To Do → In Progress → Review → Done), drag-and-drop
- **Аналитика** — статистика по статусам, просроченные задачи, графики
- **Профиль** — редактирование имени, загрузка аватара

## Стек технологий

| Категория | Технологии |
|-----------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Radix UI |
| **Backend** | Next.js Server Actions |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma 6 |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage (аватары) |
| **Validation** | Zod |
| **DnD** | @dnd-kit |
| **Charts** | Recharts |
| **Deploy** | Vercel |

## Быстрый старт

### Требования

- Node.js 18+
- npm/yarn/pnpm
- PostgreSQL (или Supabase аккаунт)

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/kpizzy812/task-manager.git
cd task-manager

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env
# Заполнить .env своими данными

# Применить миграции
npx prisma migrate dev

# Запустить dev-сервер
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000)

### Переменные окружения

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxx"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Структура проекта

```
src/
├── actions/        # Server Actions (auth, tasks, projects, profile)
├── app/            # Next.js App Router
│   ├── (auth)/     # Страницы авторизации
│   ├── (dashboard)/ # Защищённые страницы
│   └── invite/     # Приглашения в проекты
├── components/     # React компоненты
│   ├── ui/         # UI Kit (Radix + Tailwind)
│   ├── tasks/      # Kanban, карточки задач
│   ├── projects/   # Проекты, участники
│   └── analytics/  # Графики, статистика
├── lib/            # Утилиты, валидации, Prisma клиент
└── middleware.ts   # Защита роутов
```

## Скрипты

```bash
npm run dev      # Запуск dev-сервера
npm run build    # Production сборка
npm run start    # Запуск production
npm run lint     # Проверка ESLint
npm run test     # Запуск тестов
```

## Безопасность

- Rate limiting на аутентификацию (защита от brute force)
- Валидация всех входных данных через Zod
- Row-level проверки доступа к проектам и задачам
- Secure cookies для сессий

## Лицензия

MIT
