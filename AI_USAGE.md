# AI usage

The application uses a provider abstraction so OpenAI-compatible services can be selected per user or project. Provider base URLs, model names, and API keys are configuration data; they are not hardcoded in source.

API keys are intended to be encrypted with AES-256-GCM before persistence. The encryption key is supplied through `server/.env` and must never be committed.
