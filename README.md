# skills

**Личные скиллы для ИИ-ассистентов**

<a href="https://github.com/anthropics/skills"><img src="https://img.shields.io/badge/format-Agent%20Skills-355981?style=for-the-badge" alt="Agent Skills format"/></a>
<a href="https://github.com/goosen-x/skills/commits/main"><img src="https://img.shields.io/github/last-commit/goosen-x/skills?style=for-the-badge&color=355981&label=updated" alt="Last commit"/></a>
<a href="https://github.com/goosen-x/skills/stargazers"><img src="https://img.shields.io/github/stars/goosen-x/skills?style=for-the-badge&color=355981" alt="Stars"/></a>

Claude Code, Cursor, Codex, Factory, Qwen и всё остальное, что понимает формат [Agent Skills](https://github.com/anthropics/skills), читают один и тот же файл: папку с `SKILL.md` внутри. Один репозиторий, симлинки в папку скиллов нужного инструмента.

## Скиллы

| Скилл | Что делает | Триггеры |
|---|---|---|
| **[unslop](./unslop)** | Убирает ИИ-паттерны из текста: инфляцию значимости, канцелярит, тире через слово. Для README, постов в блог и любой прозы, которая должна звучать по-человечески. | «unslop», «почисти текст», «сделай текст живым» |
| **[motion-video](./motion-video)** | Моушн-видео и промо-ролики из кода: сцены на HTML, рендер в MP4 через Playwright и ffmpeg, склейки под бит музыки, цикл критики по кадрам. Новый проект: `bash motion-video/scripts/new-project.sh <папка>`. | «моушн видео», «шоурил», «сделай ролик» |
| **[dispatcher](./dispatcher)** | Для лид-агента на многошаговой задаче. Не писать код самому, а ставить его субагенту, не верить чужому «готово» без диффа, держать себя на дорогой модели, а реализацию на Sonnet. | поведенческий, без лексического триггера |
| **[grill](./grill)** | Дожимает неоднозначный план до общего понимания вопросами по делу, раундами по всему фронтиру сразу, не додумывая развилки самому. Факты ищет сам, не спрашивает. | «допроси меня по плану», «дожми план», «грильми» |

## Подключение

Склонируйте репозиторий и закиньте симлинк в папку скиллов нужного инструмента:

```bash
git clone https://github.com/goosen-x/skills.git
ln -s "$PWD/skills/unslop" ~/.claude/skills/unslop
```

Claude Code читает папку `~/.claude/skills`. Codex и Gemini CLI вместе смотрят в общий путь `~/.agents/skills`. Один клон репозитория и симлинк под каждый нужный скилл. Обновления в репозитории подхватятся сами.

## Новый скилл

```
skills/
  название-скилла/
    SKILL.md
```

Фронтматтер (YAML-блок между `---` в начале файла) несёт два поля: `name` и `description`. В описании пишите, когда скилл применять и какие фразы его включают, а не пересказ самого процесса. Агент должен прочитать `SKILL.md` целиком, а не подменить это описанием.
