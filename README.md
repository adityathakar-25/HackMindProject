# SkillsMirage 🇮🇳

> **Know your AI displacement risk. Get a personalised reskilling plan.**

SkillsMirage is a full-stack web application built for Indian workers to understand their risk of AI-driven job displacement and receive actionable, week-by-week reskilling paths using free government courses (NPTEL, SWAYAM, PMKVY).

---

## 📌 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [How It Works](#how-it-works)
- [Target Cities & Roles](#target-cities--roles)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔴 **AI Risk Score** | Computes a 0–100 displacement risk score based on live hiring trends, AI tool mentions in job descriptions, and skill gaps |
| 📊 **Live Job Market Data** | Scrapes real job postings via JSearch API (RapidAPI) across 20 Indian cities and 10 roles daily |
| 🗺️ **Reskilling Path Generator** | Week-by-week plan with free NPTEL, SWAYAM & PMKVY courses matched to your skill gaps |
| 🤖 **AI Career Advisor Chatbot** | Bilingual (English & Hindi) chatbot powered by Groq (llama-3.3-70b) with live job market context |
| 📈 **L1 Market Dashboard** | 3-tab analytics dashboard — Hiring Trends, Rising/Declining Skills, AI Vulnerability Index |
| 🔐 **Auth System** | JWT-based register/login with protected routes |
| 🌐 **Bilingual UI** | Full English and Hindi support in chatbot responses |
| 🛡️ **Admin Panel** | Trigger job scraper runs with city/role selection and live activity log |

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** (Python) — REST API framework
- **Motor** — Async MongoDB driver
- **MongoDB Atlas** — Cloud database
- **Groq API** — LLM provider (llama-3.3-70b-versatile) — free, no card required
- **JSearch API** (RapidAPI) — Real job postings data
- **JWT** — Authentication tokens
- **httpx** — Async HTTP client
- **python-dotenv** — Environment config

### Frontend
- **React 18** — UI framework
- **React Router v6** — Client-side routing
- **Axios** — HTTP requests
- **Create React App** — Build tooling

---

## 📁 Project Structure

```
HackMindProject/
├── backend/
│   ├── core/
│   │   ├── database.py          # MongoDB connection (SSL-safe for Python 3.13)
│   │   └── security.py          # JWT token creation & verification
│   ├── middleware/
│   │   └── auth.py              # Auth middleware / get_current_user
│   ├── models/
│   │   └── user.py              # User CRUD helpers
│   ├── routers/
│   │   ├── auth.py              # POST /api/auth/register, /login, /me
│   │   ├── users.py             # GET/PUT/DELETE /api/users
│   │   ├── l1.py                # L1 scraper & analytics endpoints
│   │   └── l2.py                # L2 worker intelligence endpoints
│   ├── schemas/
│   │   ├── user.py              # Pydantic request/response models
│   │   └── l2.py                # L2 schema models
│   ├── scraper/
│   │   └── job_scraper.py       # JSearch API scraper + seed data fallback
│   ├── services/
│   │   ├── chat_service.py      # Groq/Gemini chatbot with L1 RAG context
│   │   ├── nlp_service.py       # Skill extraction from free text
│   │   ├── risk_service.py      # AI displacement risk score computation
│   │   └── reskill_service.py   # Week-by-week reskilling path generator
│   ├── main.py                  # FastAPI app entry point
│   └── requirements.txt
│
└── frontend/
    ├── public/
    └── src/
        ├── components/
        │   ├── Navbar.js
        │   ├── l1/
        │   │   ├── AdminPanel.js       # Scraper control UI
        │   │   ├── TrendsTab.js        # Hiring trends chart
        │   │   ├── SkillsTab.js        # Rising/declining skills
        │   │   └── VulnerabilityTab.js # AI vulnerability index
        │   └── l2/
        │       ├── WorkerPage.js       # Worker profile & risk score
        │       └── ChatbotModal.js     # Bilingual AI chat interface
        ├── context/
        │   └── AuthContext.js          # Global auth state
        ├── pages/
        │   ├── Home.js
        │   ├── Login.js
        │   ├── Register.js
        │   └── Dashboard.js
        └── App.js
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+ (tested on 3.13)
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com))
- JSearch API key (free tier at [RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch))

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/HackMindProject.git
cd HackMindProject
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables section below)
cp .env.example .env
# Edit .env with your actual keys

# Start the backend
python -m uvicorn main:app --reload --port 8000
```

You should see:
```
✅ MongoDB Connected successfully!
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend
npm start
```

The app opens at **http://localhost:3000**

> ⚠️ Both terminals must be running simultaneously. The frontend proxies API requests to `http://localhost:8000`.

---

## 🔑 Environment Variables

Create `backend/.env` with the following:

```env
PORT=8000

# MongoDB Atlas connection string
# Get from: cloud.mongodb.com → Connect → Drivers
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mernapp?retryWrites=true&w=majority

# JWT secret — generate with: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET=your_64_char_random_hex_string

# Environment
ENV=development

# JSearch API (RapidAPI) — free 500 req/month
# Get from: rapidapi.com → search "JSearch" → Subscribe → Copy X-RapidAPI-Key
JSEARCH_API_KEY=your_jsearch_key_here

# Groq API — FREE, 14,400 req/day, no credit card needed
# Get from: console.groq.com → API Keys → Create API Key
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Gemini API — optional fallback (free tier)
# Get from: aistudio.google.com/apikey
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxxxx
```

### MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster
3. **Database Access** → Add user with username & simple password (no special characters)
4. **Network Access** → Add IP `0.0.0.0/0` (allow all)
5. **Connect** → Drivers → Copy connection string → replace `<password>`

> 💡 **Note:** If your password has special characters like `@`, `#`, `!`, the `database.py` file auto-encodes them. But it's easiest to use a simple alphanumeric password.

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/auth/me` | Get current user (auth required) |

### L1 — Job Market Intelligence
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/l1/scrape` | Trigger scraper run (background) |
| GET | `/api/l1/status` | Scraper status & job post counts |
| GET | `/api/l1/trends` | Hiring trends by city/role over time |
| GET | `/api/l1/skills` | Rising & declining skills |
| GET | `/api/l1/vulnerability` | AI Vulnerability Index by city/role |
| GET | `/api/l1/jobs` | Raw job postings (paginated) |

### L2 — Worker Intelligence
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/l2/profile` | Create worker profile + extract skills |
| GET | `/api/l2/profile/:id` | Get a specific profile |
| GET | `/api/l2/profiles/me` | All profiles for logged-in user |
| POST | `/api/l2/profile/:id/score` | Compute AI displacement risk score |
| POST | `/api/l2/profile/:id/reskill` | Generate week-by-week reskilling path |
| POST | `/api/l2/chat` | Ask the AI career advisor chatbot |
| GET | `/api/l2/samples` | Load preloaded sample worker profiles |

---

## ⚙️ How It Works

### Layer 1 — Job Market Scraper

1. **Scraper** calls JSearch API for each city × role combination (20 cities × 10 roles)
2. Falls back to realistic **seed data** if API quota is exceeded
3. Data is stored in MongoDB `job_posts` collection
4. **Aggregator** runs after scraping — computes daily summaries per city+role stored in `aggregates` collection
5. Tracks: `posting_count`, `ai_tool_mention_rate`, `top_skills`, `remote_count`

### Layer 2 — Worker Intelligence

1. Worker submits their **job title, city, years of experience, and a free-text writeup**
2. **NLP service** extracts skills from the writeup using regex pattern matching against 40+ skill vocabulary items
3. **Risk service** computes a 0–100 score based on:
   - Hiring decline rate (L1 trend data)
   - AI tool mention rate in job descriptions
   - Skill gap vs. market demand
4. **Reskilling service** finds target roles the worker can transition to and generates a week-by-week plan using real NPTEL, SWAYAM & PMKVY course links
5. **Chatbot** answers questions using live L1 evidence as context (RAG pattern) via Groq LLM

### Chatbot — 5 Question Types

The AI advisor handles:
1. "Why is my risk score so high?"
2. "What jobs are safer for someone like me?"
3. "Show me paths I can complete under 3 months"
4. "How many BPO jobs are available in Indore right now?" ← live L1 query
5. Full Hindi support — "मुझे क्या करना चाहिए?"

---

## 🏙️ Target Cities & Roles

**20 Cities:**
Bangalore, Mumbai, Delhi, Hyderabad, Pune, Chennai, Kolkata, Jaipur, Ahmedabad, Noida, Indore, Nagpur, Chandigarh, Bhopal, Lucknow, Kochi, Coimbatore, Surat, Vadodara, Patna

**10 Roles:**
Data Entry, BPO, Data Analyst, Software Engineer, Customer Support, Content Writer, HR Executive, Accountant, Sales Executive, Digital Marketing

---

## 🐛 Common Issues & Fixes

| Error | Fix |
|---|---|
| `ECONNREFUSED` on frontend | Backend is not running — start it with `uvicorn` in a separate terminal |
| `bad auth: authentication failed` | Wrong username/password in `MONGO_URI` — check `backend/.env` |
| `SSL handshake failed` | Already handled in `database.py` via `tlsAllowInvalidCertificates=True` |
| `Username must be escaped RFC 3986` | Special chars in MongoDB password — use a simple alphanumeric password |
| Gemini 429 rate limit | Use Groq instead — set `GROQ_API_KEY` in `.env` (free, no card) |
| Gemini 404 model not found | Model updated to `gemini-2.0-flash` in `chat_service.py` |
| `⚠️ No AI API key` | Add `GROQ_API_KEY=gsk_...` to `backend/.env` and restart backend |

---

## 📦 Backend Dependencies

```
fastapi==0.115.0
uvicorn[standard]==0.29.0
motor==3.7.1
pymongo==4.16.0
python-jose[cryptography]==3.3.0
bcrypt==4.1.3
python-dotenv==1.0.1
pydantic[email]==2.10.6
httpx==0.27.0
beautifulsoup4==4.12.3
lxml==5.3.1
```

---

## 👥 Built For

Indian blue-collar and white-collar workers in roles most vulnerable to AI automation — BPO agents, data entry operators, customer support executives, and more — giving them the tools to understand their risk and take action.

---

*Built with ❤️ for HackMind Hackathon 2026*