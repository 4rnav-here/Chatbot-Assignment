# ChatBot Platform

A minimal chatbot platform with JWT authentication, project management, and Gemini AI integration.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (installed and running)
- **Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))

### 1. Database Setup (PostgreSQL)

If you haven't set up PostgreSQL yet:

```bash
# Open psql (PostgreSQL command line)
psql -U postgres

# Create a new database
CREATE DATABASE chatbot_db;

# Exit psql
\q
```

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment file and edit it
copy .env.example .env
```

Edit the `.env` file with your settings:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/chatbot_db"
JWT_SECRET="your-secret-key-change-this"
GEMINI_API_KEY="your-gemini-api-key"
```

Run database migrations:

```bash
# Generate Prisma client and create tables
npx prisma migrate dev --name init

# Start the server
npm run dev
```

The API will be running at `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Serve the static files (using any static server)
npx serve .
```

The frontend will be running at `http://localhost:3000`

## 📁 Project Structure

```
ChatBot Assignment/
├── backend/
│   ├── src/
│   │   ├── controllers/      # HTTP request handlers
│   │   ├── routes/           # API route definitions
│   │   ├── middleware/       # Auth, error handling, file uploads
│   │   ├── services/         # Gemini AI integration
│   │   └── index.js          # Express server entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── uploads/              # Uploaded files storage
│   └── package.json
├── frontend/
│   ├── index.html            # Login/Register page
│   ├── dashboard.html        # Project management
│   ├── chat.html             # Chat interface
│   ├── css/styles.css        # All styles
│   └── js/                   # JavaScript files
├── docs/
│   ├── NOTES.md              # Detailed code explanations
│   └── ARCHITECTURE.md       # System design
└── README.md
```

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/:projectId/messages` | Get messages |
| POST | `/api/chat/:projectId` | Send message |
| DELETE | `/api/chat/:projectId/messages` | Clear chat |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files/:projectId` | List files |
| POST | `/api/files/:projectId` | Upload file |
| DELETE | `/api/files/:projectId/:fileId` | Delete file |

## 🎨 Features

- **User Authentication**: Secure JWT-based auth with bcrypt password hashing
- **Project Management**: Create, edit, delete AI chatbot projects
- **Custom System Prompts**: Define unique personalities for each chatbot
- **Chat Interface**: Real-time conversation with AI using Gemini
- **File Uploads**: Attach files to projects
- **Message History**: Persistent chat history per project
- **Responsive Design**: Clean, minimal UI that works on all devices

## 🔒 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret for signing tokens | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `10485760` |

## 📝 Development

```bash
# Start backend in development mode (with hot reload)
cd backend && npm run dev

# View database in Prisma Studio
cd backend && npm run db:studio

# Run database migrations
cd backend && npm run db:migrate
```

## 📖 Learn More

- [NOTES.md](docs/NOTES.md) - Detailed code explanations
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design documentation
