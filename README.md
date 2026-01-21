# 🤖 AI ChatBot Platform

A premium, full-stack AI chatbot platform that allows users to create intelligent agents, manage knowledge bases through file uploads, and engage in meaningful conversations powered by the Gemini 1.5 Flash API.

## 🌍 Live Deployment

- **Backend API:** [Railway](https://chatbot-assignment-production.up.railway.app/)
- **Frontend Dashboard:** [Vercel](https://chatbot-assignment.vercel.app/) (Update your local `api.js` if deploying your own)

## ✨ Features

- **Custom AI Agents:** Create projects with unique system prompts to define personality and expertise.
- **Knowledge Base:** Upload PDF and Text files to provide context to your AI agents.
- **Stateless Auth:** Secure authentication using JWT and Bcrypt hashing.
- **Premium UI:** Modern, responsive interface with a focus on aesthetics and micro-interactions.
- **High Performance:** Optimized with GZIP compression, database indexing, and non-blocking script loading.

## 🛠 Tech Stack & Tools

### Frontend (Vercel)
- **Vanilla JavaScript:** Powers the dynamic UI updates, message rendering, and API interactions without the overhead of a framework.
- **CSS3 (Modern UI):** Utilizes custom properties (variables) for a consistent design system, including glassmorphism effects and micro-animations.
- **Fetch API:** Used within a centralized `js/api.js` client to handle all backend communication and JWT injection.

### Backend (Railway)
- **Express.js:** The web framework used to build the RESTful API endpoints.
- **Prisma ORM:** Provides a high-level abstraction over the database, allowing for type-safe queries and easy schema management.
- **PostgreSQL (Supabase):** Robust relational database with indexed foreign keys for sub-millisecond lookups.
- **Google Gemini 1.5 Flash:** The brain of the chatbot, utilized for its high speed and impressive context window.
- **Multer:** Handles multi-part form data during file uploads to the server.
- **compression:** A performance middleware that GZIPs all response data, ensuring the app remains snappy.
- **jsonwebtoken & bcryptjs:** Combined to create a secure, industry-standard authentication flow.

## 📁 Project Structure

```text
├── backend/
│   ├── prisma/             # Database schema and migrations
│   ├── src/
│   │   ├── controllers/    # Route logic (Auth, Chat, Project, File)
│   │   ├── middleware/     # Auth, Error, and Upload handlers
│   │   ├── routes/         # Express API endpoints
│   │   ├── services/       # AI (Gemini) integration service
│   │   └── lib/            # Shared utilities (Prisma client)
│   └── uploads/            # Local storage for user files
├── frontend/
│   ├── css/                # Main application styling (styles.css)
│   ├── js/                 # API client, Auth, and Page logic
│   └── *.html              # Application pages (index, dashboard, chat)
└── architecture/
    └── README.md           # Detailed system architecture and flows
```

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- Google Gemini API Key

### Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/4rnav-here/Chatbot-Assignment.git
   cd Chatbot-Assignment/backend
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` in `backend/`:
   ```env
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   JWT_SECRET="your_secret"
   GEMINI_API_KEY="your_key"
   PORT=5000
   ```

3. **Database Migration**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Run**
   ```bash
   npm run dev
   ```

## 📖 Deep Dive
For detailed information on system sequences (Auth, Chat) and architectural design choices, please refer to the [Architecture Documentation](architecture/README.md).
