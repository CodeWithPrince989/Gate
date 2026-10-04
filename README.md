# GateTracker: GATE CSE Study Intelligence Platform

GateTracker is a comprehensive, full-stack study analytics and tracking platform specifically designed for GATE (Graduate Aptitude Test in Engineering) Computer Science candidates. It provides students with data-driven insights, progress monitoring, and resource management to optimize their preparation strategy.

## 📖 Overview

GateTracker enables students to log their study sessions, track topics covered, monitor their daily streak, and visualize their progress over time. Built with a robust Django REST backend and a modern React frontend, the platform ensures a seamless, responsive, and cross-platform user experience.

## 🏗️ Architecture

The system follows a typical client-server architecture with a decoupled frontend and backend:

- **Frontend**: A Single Page Application (SPA) hosted on Vercel, providing a rich, interactive user interface.
- **Backend API**: A RESTful Django service hosted on Render, handling business logic, data persistence, and secure cross-origin authentication.
- **Database**: A fully managed Serverless PostgreSQL instance hosted on Neon.

## 🛠️ Technology Stack

### Backend Infrastructure
- **Framework**: Django 6.x / Django REST Framework
- **WSGI Server**: Gunicorn
- **Database**: PostgreSQL (Neon Serverless)
- **Static File Management**: WhiteNoise
- **Authentication**: Session-based auth with secure cross-origin cookies (`SameSite=None; Secure`)

### Frontend Ecosystem
- **Core**: React 18, TypeScript, Vite 5
- **Styling**: TailwindCSS 3
- **State Management & Routing**: React Router v6
- **Data Visualization**: Chart.js, react-chartjs-2
- **Icons**: Lucide React

## 🗄️ Core Data Models

The system architecture revolves around two primary entities:

### 1. `StudySession`
Represents an atomic unit of a student's study period.
- `user`: Foreign Key to the User model.
- `subject`: Domain category (e.g., DSA, OS, DBMS, CN).
- `study_type`: Methodology (Theory, Practice, Lecture, Revision).
- `duration_minutes`: Time invested.
- `questions_solved`: Quantitative output metric.
- `lecture_minutes`: Time spent on video/audio resources.

### 2. `DailyStats`
An aggregated materialization of user statistics, automatically updated when study sessions are recorded.
- `total_study_time`: Aggregate daily duration.
- `total_questions`: Aggregate daily questions solved.
- `total_lectures`: Aggregate daily lecture time.

## 🔌 API Reference

### Authentication Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register/` | Provisions a new user account. |
| `POST` | `/api/auth/login/` | Authenticates and returns a secure session cookie. |
| `POST` | `/api/auth/logout/` | Invalidates the current session. |
| `GET`  | `/api/auth/check/` | Validates current session status. |

### Application Services (Authenticated Context)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/dashboard/` | Retrieves aggregate daily statistics and streak info. |
| `GET`  | `/api/analytics/` | Fetches subject-specific breakdowns and averages. |
| `GET`  | `/api/heatmap/` | Provides temporal study activity data. |
| `POST` | `/save-session/` | Persists a new `StudySession` instance. |
| `GET`  | `/export/` | Generates a CSV export of user session history. |

*(Note: Additional endpoints exist for chart data, history, and gamified growth tree elements).*

## 💻 Local Development Setup

To run GateTracker locally, follow these instructions:

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (Local or Cloud instance)

### Backend Setup
1. Navigate to the project root directory.
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables (`.env`) for `DATABASE_URL`, `SECRET_KEY`, etc.
5. Apply database migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the `frontend/` directory.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

```text
.
├── gate_tracker/          # Django core settings and WSGI/ASGI configurations
├── tracker/               # Primary Django application module (Models/Views)
├── frontend/              # React single-page application
│   ├── src/
│   │   ├── api/           # Typed API service clients
│   │   ├── components/    # Reusable UI elements
│   │   ├── pages/         # Route-level views
│   │   └── data/          # Static JSON payloads
│   ├── vite.config.ts     # Vite bundler configuration
│   └── tailwind.config.js # Tailwind CSS utility definitions
├── requirements.txt       # Python dependency definitions
└── manage.py              # Django administrative CLI
```