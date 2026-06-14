# EcoTrack AI 🌱

EcoTrack AI is a premium, production-ready AI-powered web platform designed to help users understand, track, visualize, and reduce their carbon footprint. Utilizing gamification mechanisms, a Gemini-powered Climate Coach, and native interactive SVG charts, the application makes environmental tracking as simple and engaging as fitness tracking.

Inspired by premium product dashboards (Apple Human Interface, Stripe, Notion, Tesla), the platform incorporates a sleek glassmorphic theme, smooth animations, and is optimized for both desktop and mobile layouts.

---

## 📁 Project Directory Structure

```text
ecotrack-ai/
├── docker-compose.yml       # Local Docker Orchestration
├── README.md                # System Documentation & Deployment Guide
│
├── backend/                 # Python FastAPI Backend
│   ├── Dockerfile           # Backend Container Build configuration
│   ├── requirements.txt     # Python Dependencies
│   ├── main.py              # Application Entry Point
│   ├── database.py          # SQLAlchemy Session Setup (SQLite/PostgreSQL)
│   ├── models.py            # SQLAlchemy Relational Models Schema
│   ├── schemas.py           # Pydantic Validation Schemas
│   ├── auth.py              # JWT and Password Hashing helpers
│   └── routers/             # API Router Modules
│       ├── auth.py          # Register, Login, and Mock OAuth
│       ├── calculator.py    # Carbon score calculations
│       ├── tracker.py       # Daily logging & streaks tracking
│       ├── ai.py            # Gemini AI Coach & PDF Report generator
│       ├── gamification.py  # Leaderboards, Badges, & Certificates
│       └── admin.py         # Administrative metrics & challenges creation
│
└── frontend/                # React Vite Frontend (Vanilla CSS)
    ├── index.html           # Main HTML Entry & SEO Meta Tags
    ├── package.json         # Node Dependencies Configuration
    ├── vite.config.js       # Vite Server Proxy Config
    └── src/
        ├── main.jsx         # React Bootstrap Entry
        ├── index.css        # Vanilla CSS Design System Variables & Utilities
        ├── App.jsx          # Route Manager, Modals, & Global States
        └── components/      # Responsive UI Subcomponents
            ├── LandingPage.jsx  # Hero Page, Earth Canvas, Live Chat Sandbox
            ├── Sidebar.jsx      # Navigation Bar, Theme Toggler, & profile footers
            ├── Dashboard.jsx    # KPI Panels, XP Progress Ring & AI Notifications
            ├── Calculator.jsx   # Multi-step Carbon Calculator Wizard
            ├── Tracker.jsx      # Logging category forms & timeline history feeds
            ├── AICoach.jsx      # Coach chat, OCR receipt scanner upload forms
            ├── Analytics.jsx    # Native SVG Area / Bar charts & log heatmaps
            ├── Gamification.jsx # Available challenges list, Badge lockers, & certificates
            └── AdminDashboard.jsx # System stats panels & User databases
```

---

## ⚡ Quick Start (Local Setup)

The platform is designed to support a real Python backend but includes an intelligent, browser-side **Demo Mode** fallback. If the backend is not running, clicking **Try Demo** on the Landing Page enables a fully operational, local sandbox database inside the browser for zero-setup evaluation.

### Option 1: Docker Compose (Recommended)
Launch both frontend and backend services instantly:
```bash
docker-compose up --build
```
* Frontend will run at: `http://localhost:5173`
* Backend API docs will run at: `http://localhost:8000/docs`

### Option 2: Manual Development Build

#### 1. Setup Backend:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

#### 2. Setup Frontend:
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite server:
   ```bash
   npm run dev
   ```
Open `http://localhost:5173` in your browser.

---

## 🌍 Production Deployment Guide

### Frontend (Vercel or Netlify)
The frontend compiles to static HTML/CSS/JS assets that can be hosted on any CDN:
1. Import the project folder containing the `frontend` folder into your Vercel or Netlify dashboard.
2. Configure **Build Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: `frontend`
3. Click **Deploy**.

### Backend (Render or Render Web Service)
Deploy the Python FastAPI container:
1. Create a new **Web Service** on Render linking to your repository.
2. Select **Docker** as the environment.
3. Configure the path to the Dockerfile: `backend/Dockerfile`.
4. Define the **Environment Variables** in the panel:
   - `JWT_SECRET_KEY`: A secure random password string.
   - `DATABASE_URL`: Your production PostgreSQL database URL connection string (e.g. `postgresql://...`). If left empty, it defaults to local SQLite.
   - `GEMINI_API_KEY`: Your Google Gemini API Key for dynamic Climate Coach conversations.

---

## 🔒 Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `JWT_SECRET_KEY` | Secret seed to encrypt/sign authorization tokens. | `ecotrack_secret_key_super_secure_987654321` |
| `DATABASE_URL` | SQLAlchemy Connection URL. SQLite for dev, Postgres for prod. | `sqlite:///./ecotrack.db` |
| `GEMINI_API_KEY` | Google Gemini developer key to trigger generative AI coach responses. | *Optional (Falls back to local mock chatbot)* |
