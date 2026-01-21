# 🤖 AI ChatBot Platform

A premium, full-stack AI chatbot platform that allows users to create intelligent agents, manage knowledge bases through file uploads, and engage in meaningful conversations powered by the Gemini 1.5 Flash API.

## ✨ Features

- **Custom AI Agents:** Create projects with unique system prompts to define personality and expertise.
- **Knowledge Base:** Upload PDF and Text files to provide context to your AI agents.
- **Stateless Auth:** Secure authentication using JWT and Bcrypt hashing.
- **Premium UI:** Modern, responsive interface with a focus on aesthetics and micro-interactions.
- **Performance Optimized:** Includes GZIP compression and database indexing for a snappy experience.

## 🛠 Tech Stack & Tools

### Frontend (The User Interface)
- **Vanilla JavaScript:** Powers the dynamic UI updates, message rendering, and API interactions without the overhead of a framework.
- **CSS3 (Modern UI):** Utilizes custom properties (variables) for a consistent design system, including glassmorphism effects and micro-animations.
- **Fetch API:** Used within a centralized `js/api.js` client to handle all backend communication and JWT injection.

### Backend (The Logical Engine)
- **Express.js:** The web framework used to build the RESTful API endpoints.
- **Prisma ORM:** Provides a high-level abstraction over the database, allowing for type-safe queries and easy schema management.
- **Google Gemini 1.5 Flash:** The brain of the chatbot, utilized for its high speed and impressive context window.
- **Multer:** Specifically chosen for its efficiency in handling multi-part form data during file uploads.
- **compression:** A performance middleware that GZIPs all response data, ensuring the app remains snappy even on mobile networks.
- **jsonwebtoken & bcryptjs:** Combined to create a secure, industry-standard authentication flow.

## 📁 Project Structure

```text
├── backend/
│   ├── prisma/             # Database schema and migrations
│   ├── src/
│   │   ├── controllers/    # Route logic (Auth, Chat, Project, File)
│   │   ├── middleware/     # Auth and Error handlers
│   │   ├── routes/         # Express API endpoints
│   │   ├── services/       # AI (Gemini) integration
│   │   └── lib/            # Shared utilities (Prisma client)
│   └── uploads/            # Local storage for user files
├── frontend/
│   ├── css/                # Main application styling
│   ├── js/                 # API client and page logic
│   └── *.html              # Application pages
└── architecture/
    └── README.md           # Detailed system architecture
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (e.g., Supabase)
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd ChatBot-Assignment
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file based on the environment variables section below
   npx prisma generate
   npx prisma migrate deploy
   npm start
   ```

3. **Frontend Setup**
   The frontend is static. You can serve it using any local server (e.g., Live Server in VS Code) or simply open `index.html`. For production, update the `API_BASE_URL` in `frontend/js/api.js`.

### Environment Variables (.env)
```env
DATABASE_URL="your-postgresql-url"
DIRECT_URL="your-postgresql-direct-url"
JWT_SECRET="your-secure-secret"
GEMINI_API_KEY="your-google-api-key"
PORT=5000
```

## 📖 Documentation
For a deep dive into how the system works, check out the [Architecture Documentation](architecture/README.md).
