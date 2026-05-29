# QuizMaster

> A versatile microservices application for creating and taking any type of quizzes.
> Built with React · Node/Express · MongoDB · Docker · Jenkins.

---

## Project Structure

```
quizmaster/
├── docker-compose.yml          # Orchestrates all 4 microservices
├── Jenkinsfile                 # CI/CD pipeline definition
├── .gitignore
├── README.md
│
├── backend/                    # Microservice 2 — Node.js/Express API
│   ├── Dockerfile              # Custom image build
│   ├── .dockerignore
│   ├── package.json
│   └── server.js               # Express server + Mongoose + seed logic
│
└── frontend/                   # Microservice 1 — React UI
    ├── Dockerfile              # Custom image (multi-stage → Nginx)
    ├── .dockerignore
    ├── nginx.conf              # API proxy + SPA fallback config
    ├── package.json
    └── src/
        ├── index.js
        ├── App.js              # Quiz logic + all components
        └── App.css             # Neo-Brutalism design system
```

---

## Architecture

```
Browser
  │
  ▼
┌────────────────────────┐
│  quiz-ui               │  Port 3000  (custom Dockerfile + Nginx)
│  React + Neo-Brutalism │
└────────┬───────────────┘
         │ /api/*  (nginx proxy)
         ▼
┌────────────────────────┐
│  quiz-api              │  Port 5000  (custom Dockerfile + Node.js)
│  Express + Mongoose    │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  mongo                 │  Port 27017 (Docker Hub: mongo:7.0)
│  MongoDB 7.0           │
└────────────────────────┘
         ↑
┌────────────────────────┐
│  mongo-express         │  Port 8081  (Docker Hub: mongo-express:1.0.2)
│  DB Admin UI           │
└────────────────────────┘
```

---

## Quick Start (Docker)

```bash
# 1. Clone the repository
git clone <your-repo-url> quizmaster
cd quizmaster

# 2. Launch all services
docker compose up -d --build

# 3. Access the application
#    Frontend  → http://localhost:3000
#    API       → http://localhost:5000/api/health
#    DB Admin  → http://localhost:8081  (admin / admin123)
```

---

## Service Details

| Service       | Image                  | Source      | Port |
|---------------|------------------------|-------------|------|
| quiz-ui       | quiz-ui:latest         | Custom Dockerfile | 3000 |
| quiz-api      | quiz-api:latest        | Custom Dockerfile | 5000 |
| mongo         | mongo:7.0              | Docker Hub  | 27017 |
| mongo-express | mongo-express:1.0.2    | Docker Hub  | 8081 |

---

## API Endpoints

| Method | Endpoint        | Description                        |
|--------|-----------------|------------------------------------|
| GET    | /api/health     | Liveness probe                     |
| GET    | /api/questions  | Fetch all questions (no answers)   |
| POST   | /api/submit     | Submit answers, get scored results |

### POST /api/submit — Request Body
```json
{
  "answers": [
    { "questionId": "<mongo_id>", "selectedIndex": 1 },
    { "questionId": "<mongo_id>", "selectedIndex": 0 }
  ]
}
```

---

## Jenkins Pipeline

### Stages
1. **Checkout** — pull latest code from SCM
2. **Teardown** — stop & remove old containers
3. **Build Images** — build `quiz-api` and `quiz-ui` in parallel
4. **Pull Hub Images** — pull `mongo:7.0` and `mongo-express:1.0.2`
5. **Deploy** — `docker compose up -d`
6. **Health Check** — verify API is responding

### Prerequisites on Jenkins Agent
- Docker Engine installed
- Docker Compose v2 (`docker compose`)
- User in `docker` group
- Git access to this repo

---

## MongoDB Credentials

| Field    | Value          |
|----------|----------------|
| Username | admin          |
| Password | quizmaster123  |
| Database | quizmaster     |

Mongo-Express admin: `admin` / `admin123`

---

## Dev Mode (without Docker)

```bash
# Terminal 1 — Backend
cd backend
npm install
MONGO_URI=mongodb://localhost:27017/quizmaster node server.js

# Terminal 2 — Frontend
cd frontend
npm install
npm start
```
