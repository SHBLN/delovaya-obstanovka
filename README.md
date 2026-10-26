# Деловая обстановка — каталог кресел и стульев

Одностраничный каталог мебели с ценами в BYN: офисные и геймерские кресла, кресла руководителя, кухонные стулья.
Заказ оформляется через менеджера: телефон, Telegram, WhatsApp, почта.

## Стек

- React 19, TypeScript, Vite 6
- Tailwind CSS 3
- React Router 7
- Playwright (e2e-тесты)
- Cloudflare (`wrangler.toml`, режим single-page application)

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # проверка типов и сборка в dist/
npm run preview    # просмотр собранной версии
npm run lint
npm run deploy     # сборка и выкладка через wrangler
```

## Страницы

| Адрес | Что показывает |
|---|---|
| `/` | Каталог: первый экран, фильтры, товары, «О нас», преимущества, контакты |
| `/privacy` | Политика конфиденциальности |
| любой другой | Страница «Страница не найдена» со ссылкой в каталог |

Якоря на главной: `#hero`, `#catalog`, `#about`, `#delivery`, `#contacts`. Прямые ссылки вида `/#contacts` работают.

## Структура `src/`

```
CatalogApp.tsx            маршруты
pages/                    FurnitureCatalogPage, PrivacyPage, NotFoundPage
components/
  catalog/                CatalogSection, CatalogSearch, FilterSelect, ProductCard, ProductModal
  contacts/               ContactMenu, ManagerContactButton, FloatingContact, MessengerLinks, ...
  site/                   SiteHeader, SiteFooter, HeroSection, AboutSection, ContactsSection, ...
  ScrollToTopButton.tsx
data/
  products.ts             51 товар, категории, варианты фильтров «Материал» и «Цвет»
  contacts.ts             телефон, почта, ссылки на мессенджеры
  navigation.ts           пункты меню
lib/
  filterProducts.ts       поиск, фильтры, сортировка по цене
  scroll.ts               переход к разделам с учётом закреплённой шапки
  useHashNavigation.ts    переход по /#раздел при открытии, смене хэша и «Назад»
```

## Как менять содержимое

- **Товары, цены, цвета, материалы** — `src/data/products.ts`. Материалы из списка `hiddenMaterialFilterOptions` остаются в карточке, но не показываются в фильтре. Каждый товар должен находиться хотя бы по одному пункту фильтра «Материал» (это проверяет тест).
- **Телефон, почта, мессенджеры** — `src/data/contacts.ts`.
- **Пункты меню** — `src/data/navigation.ts`.
- **Заголовок, описание и иконка вкладки** — `index.html` и `public/favicon.png`.

## Поведение, которое важно не сломать

- Поиск по названию и артикулу: без учёта регистра и «ё/е»; `Metta`/`Метта` и `Samurai`/`Самурай` находятся в любом написании.
- Окно «Подробнее»: закрывается кнопкой, кликом по фону и Esc; фокус не выходит за окно; страница под ним не прокручивается; двойной клик по «Подробнее» его не закрывает.
- Фильтр-списки и меню связи закрываются по Esc и клику снаружи.
- На телефоне закреплённая нижняя панель связи не должна закрывать подвал.

## Тесты

Подробности — в [docs/QA_TESTING.md](docs/QA_TESTING.md).

```bash
npx playwright test --project=catalog
```

## Известные ограничения

- Проект вырос из другого приложения (AiVibeBoard): в репозитории остались неиспользуемые файлы и зависимости (`src/components/board`, `landing`, `backend/`, `supabase/`, часть `scripts/`). Каталог их не использует.
- Текст страницы `/privacy` — общий шаблон, его нужно сверить с реальной практикой компании.
