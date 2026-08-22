# skills

Личные скиллы для ИИ-ассистентов (Claude Code, Cursor, Codex, Factory, Qwen и подобных), которые понимают формат [Agent Skills](https://github.com/poteto/noodle) — папка с `SKILL.md` внутри.

## Скиллы

- **unslop** — убирает признаки ИИ-текста из прозы. Триггеры: «unslop», «почисти текст», «сделай текст живым», «убери признаки ИИ».

## Как подключить

Склонировать репозиторий и создать симлинк в папку скиллов нужного инструмента, например:

```bash
ln -s ~/Documents/frontend/goose-labs/skills/unslop ~/.agents/skills/unslop
```

Так уже подключены `frontend-design`, `vercel-react-best-practices` и другие общие скиллы в `~/.agents/skills`.
