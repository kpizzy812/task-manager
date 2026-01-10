/**
 * Seed script for demo data
 * Run after user kapelane4l@gmail.com is registered
 *
 * Usage: npx tsx prisma/seed-demo.ts
 */

import { PrismaClient, TaskStatus, TaskPriority, ProjectRole } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAIL = "kapelane4l@gmail.com";

// Helper to create dates relative to today
const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

async function main() {
  console.log("🌱 Starting demo seed...\n");

  // Find the user
  const user = await prisma.profile.findUnique({
    where: { email: DEMO_EMAIL },
  });

  if (!user) {
    console.error(`❌ User ${DEMO_EMAIL} not found!`);
    console.log("Please register the user first through the app.");
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name} (${user.email})\n`);

  // Clean up existing demo data
  console.log("🧹 Cleaning up existing projects...");
  await prisma.project.deleteMany({
    where: { ownerId: user.id },
  });

  // ==================== PROJECT 1: Запуск MVP ====================
  console.log("\n📁 Creating project: Запуск MVP...");

  const project1 = await prisma.project.create({
    data: {
      name: "Запуск MVP",
      description: "Основной проект для демонстрации возможностей TaskFlow",
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: ProjectRole.OWNER,
        },
      },
    },
  });

  // Tasks for Project 1 - various statuses, priorities, deadlines
  const tasks1 = [
    // TODO tasks
    {
      title: "Подготовить landing page",
      description: "Создать привлекательную страницу с описанием продукта и CTA",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      deadline: daysFromNow(5),
      order: 0,
    },
    {
      title: "Настроить аналитику",
      description: "Добавить Google Analytics и Mixpanel для отслеживания метрик",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      deadline: daysFromNow(7),
      order: 1,
    },
    {
      title: "Написать документацию API",
      description: "Swagger/OpenAPI документация для публичного API",
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      deadline: daysFromNow(14),
      order: 2,
    },

    // IN_PROGRESS tasks
    {
      title: "Интеграция с Telegram",
      description: "Бот для уведомлений о новых задачах и дедлайнах",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      deadline: daysFromNow(2),
      order: 0,
    },
    {
      title: "Оптимизация загрузки страниц",
      description: "Lazy loading компонентов, оптимизация bundle size",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      deadline: daysFromNow(3),
      order: 1,
    },

    // REVIEW tasks
    {
      title: "Редизайн профиля пользователя",
      description: "Новый дизайн страницы профиля с аватаром и статистикой",
      status: TaskStatus.REVIEW,
      priority: TaskPriority.MEDIUM,
      deadline: daysFromNow(1),
      order: 0,
    },
    {
      title: "Фикс drag-and-drop на мобильных",
      description: "Исправить поведение при touch-событиях на iOS",
      status: TaskStatus.REVIEW,
      priority: TaskPriority.HIGH,
      deadline: daysAgo(1), // Overdue!
      order: 1,
    },

    // DONE tasks
    {
      title: "Настроить CI/CD",
      description: "GitHub Actions для автоматического деплоя на Vercel",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      deadline: daysAgo(3),
      order: 0,
    },
    {
      title: "Добавить темную тему",
      description: "Поддержка dark mode через next-themes",
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      deadline: daysAgo(5),
      order: 1,
    },
    {
      title: "Базовая авторизация",
      description: "Регистрация, вход, выход через Supabase Auth",
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      deadline: daysAgo(10),
      order: 2,
    },

    // Overdue tasks for analytics demo
    {
      title: "Написать тесты для API",
      description: "Unit и integration тесты для server actions",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      deadline: daysAgo(2), // Overdue!
      order: 3,
    },
    {
      title: "Ревью безопасности",
      description: "Проверка на OWASP Top 10 уязвимости",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      deadline: daysAgo(1), // Overdue!
      order: 2,
    },
  ];

  for (const task of tasks1) {
    await prisma.task.create({
      data: {
        ...task,
        projectId: project1.id,
        creatorId: user.id,
        assigneeId: user.id,
      },
    });
  }

  console.log(`   ✅ Created ${tasks1.length} tasks`);

  // ==================== PROJECT 2: Маркетинг ====================
  console.log("\n📁 Creating project: Маркетинг...");

  const project2 = await prisma.project.create({
    data: {
      name: "Маркетинг",
      description: "Продвижение продукта и работа с аудиторией",
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: ProjectRole.OWNER,
        },
      },
    },
  });

  const tasks2 = [
    {
      title: "Подготовить пресс-релиз",
      description: "Анонс запуска для tech-СМИ",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      deadline: daysFromNow(10),
      order: 0,
    },
    {
      title: "Записать демо-видео",
      description: "Короткое видео для Loom с обзором функций",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      deadline: daysFromNow(1),
      order: 0,
    },
    {
      title: "Настроить email-рассылку",
      description: "Resend + welcome-письма для новых пользователей",
      status: TaskStatus.REVIEW,
      priority: TaskPriority.MEDIUM,
      deadline: daysFromNow(5),
      order: 0,
    },
    {
      title: "Создать аккаунты в соцсетях",
      description: "Twitter, LinkedIn, Telegram канал",
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      deadline: daysAgo(7),
      order: 0,
    },
  ];

  for (const task of tasks2) {
    await prisma.task.create({
      data: {
        ...task,
        projectId: project2.id,
        creatorId: user.id,
        assigneeId: user.id,
      },
    });
  }

  console.log(`   ✅ Created ${tasks2.length} tasks`);

  // ==================== PROJECT 3: Исследования ====================
  console.log("\n📁 Creating project: Исследования...");

  const project3 = await prisma.project.create({
    data: {
      name: "Исследования",
      description: "User research и анализ конкурентов",
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: ProjectRole.OWNER,
        },
      },
    },
  });

  const tasks3 = [
    {
      title: "Провести 5 интервью с пользователями",
      description: "Собрать фидбек от реальных пользователей task-менеджеров",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      deadline: daysFromNow(7),
      order: 0,
    },
    {
      title: "Анализ Linear",
      description: "Детальный разбор UX и функций Linear",
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      deadline: daysAgo(14),
      order: 0,
    },
    {
      title: "Анализ Notion",
      description: "Как Notion организует работу с задачами",
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      deadline: daysAgo(12),
      order: 1,
    },
  ];

  for (const task of tasks3) {
    await prisma.task.create({
      data: {
        ...task,
        projectId: project3.id,
        creatorId: user.id,
        assigneeId: user.id,
      },
    });
  }

  console.log(`   ✅ Created ${tasks3.length} tasks`);

  // ==================== SUMMARY ====================
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Demo seed completed!\n");
  console.log("Summary:");
  console.log(`   📁 Projects: 3`);
  console.log(`   📝 Tasks: ${tasks1.length + tasks2.length + tasks3.length}`);
  console.log(`   ⚠️  Overdue tasks: 3 (for analytics demo)`);
  console.log("\nProjects created:");
  console.log(`   1. Запуск MVP (${tasks1.length} tasks)`);
  console.log(`   2. Маркетинг (${tasks2.length} tasks)`);
  console.log(`   3. Исследования (${tasks3.length} tasks)`);
  console.log("\n✨ Ready for Loom recording!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
