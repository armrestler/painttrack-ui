# PaintTrack UI Starter

Стартовий репозиторій для першого етапу:
- мінімальний UI
- локальне збереження в браузері
- синхронізація `data.json` з окремим GitHub data repo
- чистіші межі між UI / application / infrastructure / domain

## Що вже є

- модульна структура без збірки, щоб старт був максимально простим
- екран налаштувань GitHub
- тестова кнопка `Додати тестову заявку`
- `Sync on open`
- ручна синхронізація
- окремий `data.json` у data repo

## Структура

```text
src/
  app.js
  application/
    requestService.js
    syncService.js
  domain/
    defaultData.js
  infrastructure/
    github/
      githubClient.js
    storage/
      localStore.js
  ui/
    render.js
```

## Як запустити локально

Варіант 1: просто відкрити `index.html` у браузері.

Варіант 2: для чистішого локального тесту підняти простий static server, наприклад через VS Code Live Server.

## Як викласти в GitHub

### UI repo
1. Створи новий репозиторій, наприклад `painttrack-ui`
2. Завантаж туди весь вміст цього архіву
3. Для GitHub Pages увімкни publish із branch `main`, folder `/root`
4. Відкрий отриманий URL

### Data repo
Окремо використовуй архів `painttrack-data-repo.zip`

## Які settings заповнити в UI

- `Owner` — GitHub username або org
- `Data repo` — назва приватного репозиторію з даними
- `Branch` — зазвичай `main`
- `Path` — `data.json`
- `Fine-grained PAT` — токен із доступом лише до data repo

## Поточні обмеження

- це не фінальна архітектура, а стартовий foundation
- поки що немає Excel import/export
- немає детальної картки заявки
- немає авто-sync після кожного save
- немає audit log

## Що робити далі

Етап 2:
- додати нормальний request editor
- винести domain contracts
- додати validation rules
- додати supporting materials editor
- додати авто-sync після save
