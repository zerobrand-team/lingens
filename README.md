# Lingens

## AI-генерация (OpenRouter + Gemini)

Текст генерирует серверная функция `api/generate.js` через [OpenRouter](https://openrouter.ai).

Переменные окружения задаются в **Vercel → проект → Settings → Environment Variables** (в код их не кладём):

| Переменная | Обязательна | Что это |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | да | Ключ из https://openrouter.ai/settings/keys (на аккаунте должны быть кредиты) |
| `OPENROUTER_MODEL` | нет | Модель. По умолчанию `google/gemini-3.1-flash-lite` |

После изменения переменных нужен **Redeploy** в Vercel, иначе функция продолжит работать со старыми значениями.
