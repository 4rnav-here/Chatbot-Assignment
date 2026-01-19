# ChatBot Platform - Code Notes

## Table of Contents
1. [Backend Overview](#backend-overview)
2. [Authentication System](#authentication-system)
3. [Database & Prisma](#database--prisma)
4. [API Structure](#api-structure)
5. [Gemini AI Integration](#gemini-ai-integration)
6. [File Upload System](#file-upload-system)
7. [Frontend Overview](#frontend-overview)

---

## Backend Overview

### Entry Point (`src/index.js`)

```javascript
require('dotenv').config(); // Load environment variables first
const express = require('express');
const app = express();
```

**What happens here:**
1. `dotenv.config()` reads `.env` file and loads variables into `process.env`
2. `express()` creates an Express application instance

### Middleware Chain

```javascript
app.use(cors());           // Allow cross-origin requests
app.use(express.json());   // Parse JSON request bodies
```

**Why CORS?**
- Frontend runs on `localhost:3000`
- Backend runs on `localhost:5000`
- Without CORS, browsers block cross-origin requests

**Why express.json()?**
- HTTP requests have raw text bodies
- This middleware parses JSON text into JavaScript objects
- Makes `req.body` available in routes

---

## Authentication System

### Password Hashing (`authController.js`)

```javascript
const bcrypt = require('bcryptjs');

// When registering
const salt = await bcrypt.genSalt(12);
const hashedPassword = await bcrypt.hash(password, salt);
```

**How bcrypt works:**
1. `genSalt(12)` creates a random "salt" (random text)
2. `hash(password, salt)` combines password + salt and hashes them
3. Result: `$2a$12$randomsalthere...hashedpasswordhere`

**Why 12 rounds?**
- Each round doubles the work
- 12 = secure but not too slow (~300ms)
- 10 = fast but less secure
- 14+ = very secure but slow (~1+ second)

### JWT Tokens

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: user.id, email: user.email },  // Payload (data)
  process.env.JWT_SECRET,               // Secret key
  { expiresIn: '7d' }                   // Options
);
```

**Token structure:**
```
header.payload.signature
eyJhbG...   .   eyJpZCI...   .   kWqFP...
```

- **Header**: Algorithm info (HS256)
- **Payload**: Your data (user id, email)
- **Signature**: Proves the token wasn't tampered with

### Auth Middleware (`authMiddleware.js`)

```javascript
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(' ')[1]; // "Bearer TOKEN" → "TOKEN"
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next(); // Continue to route
};
```

**Flow:**
1. Get `Authorization` header
2. Extract token (remove "Bearer ")
3. Verify token with secret key
4. If valid, attach decoded data to `req.user`
5. Call `next()` to continue

---

## Database & Prisma

### Schema Explained (`prisma/schema.prisma`)

```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  projects  Project[]
}
```

**Decorators:**
- `@id` - Primary key
- `@default(uuid())` - Auto-generate unique ID
- `@unique` - No duplicates allowed
- `Project[]` - Array of related projects (one-to-many)

### Relations

```prisma
model Project {
  userId    String
  user      User      @relation(fields: [userId], references: [id])
}
```

**This creates:**
- `userId` column in projects table
- Foreign key constraint to users.id
- Virtual `user` field for accessing related user

### Cascade Delete

```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

**Effect:** When a user is deleted, all their projects are also deleted.

### Querying with Prisma

```javascript
// Get all projects for a user
const projects = await prisma.project.findMany({
  where: { userId: req.user.id },
  include: { _count: { select: { messages: true } } }
});
```

**Breakdown:**
- `findMany` - Get multiple records
- `where` - Filter conditions
- `include` - Load related data
- `_count` - Get count of related records

---

## API Structure

### Routes → Controllers → Services

```
Route receives request
    ↓
Controller processes it
    ↓
Service does business logic
    ↓
Controller sends response
```

### Route Definition (`routes/projectRoutes.js`)

```javascript
router.use(authMiddleware); // Apply to all routes

router.get('/', getProjects);          // GET /api/projects
router.post('/', createProject);       // POST /api/projects
router.get('/:id', getProject);        // GET /api/projects/123
router.put('/:id', updateProject);     // PUT /api/projects/123
router.delete('/:id', deleteProject);  // DELETE /api/projects/123
```

### Controller Pattern

```javascript
const createProject = async (req, res, next) => {
  try {
    // 1. Extract data from request
    const { name, description } = req.body;
    
    // 2. Validate
    if (!name) {
      return res.status(400).json({ message: 'Name required' });
    }
    
    // 3. Do database operation
    const project = await prisma.project.create({
      data: { name, userId: req.user.id }
    });
    
    // 4. Send response
    res.status(201).json({ data: { project } });
    
  } catch (error) {
    next(error); // Pass to error handler
  }
};
```

---

## Gemini AI Integration

### Service Setup (`services/geminiService.js`)

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

### Sending Messages

```javascript
const chat = model.startChat({
  history: formattedHistory,   // Previous messages
  generationConfig: {
    maxOutputTokens: 2048,     // Response length limit
    temperature: 0.7,          // Creativity (0=focused, 1=random)
  }
});

const result = await chat.sendMessage(userMessage);
const response = await result.response;
const text = response.text();
```

### History Format Conversion

```javascript
// Our format:
{ role: 'assistant', content: 'Hello!' }

// Gemini format:
{ role: 'model', parts: [{ text: 'Hello!' }] }
```

**Note:** Gemini uses "model" instead of "assistant".

---

## File Upload System

### Multer Configuration (`middleware/uploadMiddleware.js`)

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save to uploads folder
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.random();
    cb(null, `${unique}-${file.originalname}`);
  }
});
```

### File Type Validation

```javascript
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // Accept
  } else {
    cb(new Error('Type not allowed'), false);  // Reject
  }
};
```

### Using in Routes

```javascript
router.post('/:projectId', upload.single('file'), uploadFile);
//                          ^^^^^^^^^^^^^^^^^
//                          This runs BEFORE your controller
//                          and handles the file upload
```

After multer runs, `req.file` contains:
```javascript
{
  originalname: 'document.pdf',
  filename: '1234567-abc-document.pdf',
  path: 'uploads/1234567-abc-document.pdf',
  mimetype: 'application/pdf',
  size: 12345
}
```

---

## Frontend Overview

### API Client (`js/api.js`)

```javascript
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  const response = await fetch(API_URL + endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message);
  }
  
  return data;
}
```

**Benefits:**
- Centralized API calls
- Automatic token adding
- Consistent error handling

### Token Storage

```javascript
// Save after login
localStorage.setItem('chatbot_token', token);

// Retrieve for requests
const token = localStorage.getItem('chatbot_token');

// Clear on logout
localStorage.removeItem('chatbot_token');
```

**Why localStorage?**
- Persists across page reloads
- Available in all tabs
- Simple key-value storage

### Page Flow

```javascript
// On protected pages (dashboard, chat)
if (!isAuthenticated()) {
  window.location.href = 'index.html';
  return;
}
```

**Pattern:**
1. Check if token exists
2. If not, redirect to login
3. If yes, load page content

### Event Handling

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault(); // Stop page reload
  
  const email = document.getElementById('email').value;
  
  try {
    setButtonLoading(submitBtn, true);
    const result = await api.post('/auth/login', { email, password });
    // Handle success
  } catch (error) {
    showAlert(error.message);
  } finally {
    setButtonLoading(submitBtn, false);
  }
});
```

**Key points:**
- `e.preventDefault()` stops form from reloading page
- Show loading state during API call
- Handle both success and error
- `finally` always runs (success or error)

---

## Common Patterns

### Response Format

All API responses follow this format:
```javascript
{
  success: true,
  message: 'Action completed',
  data: { /* actual data */ }
}

// Or for errors:
{
  success: false,
  message: 'What went wrong'
}
```

### Error Handling

```javascript
try {
  // Code that might fail
} catch (error) {
  next(error); // Pass to Express error handler
}
```

### Loading States

```javascript
function setButtonLoading(button, loading) {
  if (loading) {
    button.disabled = true;
    button.querySelector('.btn-text').style.display = 'none';
    button.querySelector('.spinner').style.display = 'inline';
  } else {
    // Reverse
  }
}
```

---

## Key Concepts Summary

| Concept | Purpose |
|---------|---------|
| JWT | Stateless authentication |
| bcrypt | Password security |
| Prisma | Database queries |
| Middleware | Request processing |
| CORS | Cross-origin requests |
| multer | File uploads |
| async/await | Handling promises |
| try/catch | Error handling |
