# CodeLume

CodeLume is an AI-powered code review workspace. Upload a project archive, explore its files, run structured security, performance, or quality reviews, and inspect the resulting issues and recommendations.

## Features

- User registration and authentication
- Project creation and ZIP upload
- File explorer with syntax highlighting
- Structured security, performance, and quality review templates
- OpenAI-compatible provider configuration
- Local Ollama support
- MongoDB Atlas or local MongoDB support
- Review lifecycle tracking:
  - Queued
  - Running
  - Complete
  - Failed
- Automatic recovery of reviews interrupted by a backend restart
- Project chat and documentation-generation foundations

## Technology stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB with Mongoose
- **AI providers:** OpenAI-compatible APIs, including Ollama
- **Validation:** Zod
- **Authentication:** JWT stored in an HTTP cookie

## Requirements

- Node.js 22 or newer
- npm
- MongoDB Atlas, or Docker Desktop for local MongoDB
- Ollama, if using a local AI model

## Installation

Clone the repository and install dependencies from the repository root:

```powershell
git clone https://github.com/MamtaPoonia333/CodeLume.git
cd CodeLume
npm install
```

Create the server environment file:

```powershell
Copy-Item server\.env.example server\.env
```

Create the client environment file:

```powershell
Copy-Item client\.env.example client\.env.local
```

Update `server\.env` before starting the application. See [Environment variables](#environment-variables).

## Database setup

### MongoDB Atlas

MongoDB Atlas is recommended for development when a local MongoDB server is not available.

1. Create an Atlas cluster.
2. Create a database user.
3. Add your development IP address to the Atlas network access list.
4. Copy the SRV connection string.
5. Set `MONGO_URI` in `server\.env`, for example:

   ```text
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
   ```

When using Atlas, Docker Desktop and the local MongoDB container are not required.

### Local MongoDB with Docker

Start the local MongoDB container:

```powershell
docker compose up -d mongo
```

Use this value in `server\.env`:

```text
MONGO_URI=mongodb://localhost:27017/code-review-assistant
```

To stop the container:

```powershell
docker compose down
```

## Ollama setup

Install Ollama from [ollama.com](https://ollama.com/download) and confirm that it is running:

```powershell
ollama list
```

Download a model that fits the available memory:

```powershell
ollama pull llama3.2:1b
```

Test the model:

```powershell
ollama run llama3.2:1b
```

Ollama normally runs at `http://localhost:11434`. Do not run `ollama serve` again if port `11434` is already in use; that usually means Ollama is already running.

### Configure Ollama in CodeLume

1. Start CodeLume and open `http://localhost:3000`.
2. Register or sign in.
3. Open **Settings → Providers**.
4. Add a provider with:

   | Field | Value |
   |---|---|
   | Label | `Local Ollama` |
   | Base URL | `http://localhost:11434/v1` |
   | Model | `llama3.2:1b` |
   | API key | Leave empty |

The provider URL must include `/v1`. CodeLume sends requests to `/chat/completions`, resulting in:

```text
http://localhost:11434/v1/chat/completions
```

For small local models, run reviews on one file or a small selection when possible. Larger project prompts require more available memory.

## Environment variables

### `server\.env`

```dotenv
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=replace-with-a-long-random-secret
ENCRYPTION_KEY=replace-with-64-hex-characters
CLIENT_URL=http://localhost:3000
```

- `JWT_SECRET` must contain at least 32 characters.
- `ENCRYPTION_KEY` must contain exactly 64 hexadecimal characters.
- Never commit `.env` files, credentials, JWTs, or provider API keys.

### `client\.env.local`

```dotenv
API_URL=http://localhost:4000
```

## Running the application

### Run frontend and backend together

```powershell
npm run dev
```

### Run them separately

Terminal 1:

```powershell
npm run dev -w server
```

Terminal 2:

```powershell
npm run dev -w client
```

Open the application at:

```text
http://localhost:3000
```

Check the backend:

```text
http://localhost:4000/health
```

Run production builds:

```powershell
npm run build
```

Run server tests:

```powershell
npm test
```

## Typical workflow

1. Register or sign in.
2. Create a project.
3. Upload a ZIP archive from the project explorer.
4. Open the **Reviews** page.
5. Select a review type and configured AI provider.
6. Start the review.
7. Monitor the review status:
   - **Queued:** the request was accepted.
   - **Running:** the AI provider is processing the code.
   - **Complete:** the structured review is ready.
   - **Failed:** the provider or response processing failed; the error is shown on the review.
8. Open a completed review to inspect issues and recommendations.

## Troubleshooting

### `ollama` is not recognized

Install Ollama and restart PowerShell so the installer can update `PATH`. Verify with:

```powershell
ollama --version
```

### Ollama returns an out-of-memory error

Use a smaller model and reduce the review scope:

```powershell
ollama pull llama3.2:1b
```

Close duplicate Node.js, Docker, and Ollama processes if the system is under memory pressure. CodeLume uses a reduced local-model context, but the operating system still needs enough free memory to load the model.

### `Only one usage of each socket address` from `ollama serve`

Ollama is already listening on port `11434`. Do not start a second daemon. Check it with:

```powershell
curl http://localhost:11434/api/tags
```

### Review returns HTTP 500

Check the backend terminal and the review's displayed error. Common causes are:

- Ollama is not running.
- The configured base URL is wrong. It should be `http://localhost:11434/v1`.
- The selected model is not installed.
- Ollama ran out of memory.
- Too much code was submitted to a small local model.

### Reviews remain pending

Refresh the Reviews page. CodeLume automatically marks pending or running reviews older than ten minutes as interrupted and failed. Start a new review after confirming the backend and AI provider are available.

### Next.js cache errors

If the frontend reports stale `.next` files or `readlink` errors, stop duplicate frontend processes and clear the generated cache:

```powershell
Remove-Item -Recurse -Force client\.next
npm run dev -w client
```

## Project documentation

- [Architecture](./ARCHITECTURE.md)
- [Server environment template](./server/.env.example)
- [Client environment template](./client/.env.example)

## Security notes

- Keep all environment files local.
- Use a strong, unique `JWT_SECRET`.
- Rotate secrets if a JWT, password, API key, or connection string is exposed.
- Restrict MongoDB Atlas network access to trusted development IPs.
- Do not upload sensitive source code to an AI provider unless that provider is approved for the project.
