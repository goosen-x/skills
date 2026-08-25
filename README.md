# skills

Личные скиллы для ИИ-ассистентов — Claude Code, Cursor, Codex, Factory, Qwen и всего, что понимает формат [Agent Skills](https://github.com/anthropics/skills): папка с `SKILL.md` внутри.

## Скиллы

- **[unslop](./unslop)** — убирает ИИ-паттерны из текста: инфляцию значимости, канцелярит, тире через слово. Пригодится для README, постов в блог и любой прозы, которая должна звучать по-человечески. Триггеры: «unslop», «почисти текст», «сделай текст живым», «убери признаки ИИ».

## Подключение

Склонировать репозиторий и закинуть симлинк в папку скиллов нужного инструмента:

```bash
ln -s ~/Documents/frontend/goose-labs/skills/unslop ~/.agents/skills/unslop
```

У меня в `~/.agents/skills` так же подключены `frontend-design`, `vercel-react-best-practices` и другие общие скиллы — этот работает по той же схеме.
