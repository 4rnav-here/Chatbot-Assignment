# ChatBot Platform - Architecture

## Overview

This document explains the system design and architecture of the ChatBot Platform.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────────────┤
│  Frontend (HTML/CSS/JS)                                             │
│  ├── index.html (Login/Register)                                    │
│  ├── dashboard.html (Project Management)                            │
│  └── chat.html (Chat Interface)                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ HTTP/HTTPS (REST API)
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js/Express)                    │
├─────────────────────────────────────────────────────────────────────┤
│  API Layer                                                          │
│  ├── Routes (authRoutes, projectRoutes, chatRoutes, fileRoutes)     │
│  ├── Controllers (Business Logic)                                   │
│  └── Middleware (Auth, Error Handling, File Upload)                 │
├─────────────────────────────────────────────────────────────────────┤
│  Service Layer                                                      │
│  └── Gemini Service (AI Integration)                                │
├─────────────────────────────────────────────────────────────────────┤
│  Data Layer                                                         │
│  └── Prisma ORM                                                     │
└─────────────────────────┬─────────────────────┬─────────────────────┘
                          │                     │
                          ▼                     ▼
              ┌───────────────────┐   ┌───────────────────┐
              │   PostgreSQL DB   │   │   Google Gemini   │
              │   (Data Storage)  │   │   (AI Provider)   │
              └───────────────────┘   └───────────────────┘
```

## Data Flow

### Authentication Flow

```
1. User submits email/password
2. Backend validates credentials
3. If valid, generate JWT token
4. Return token to frontend
5. Frontend stores token in localStorage
6. All subsequent requests include token in Authorization header
```

### Chat Flow

```
1. User types message in chat interface
2. Frontend sends POST /api/chat/:projectId
3. Backend validates user owns project
4. User message saved to database
5. Fetch conversation history (last 20 messages)
6. Send history + system prompt to Gemini
7. Gemini generates response
8. AI response saved to database
9. Return both messages to frontend
10. Frontend displays new messages
```

## Database Schema

```
User
├── id (UUID)
├── email (unique)
├── password (hashed)
├── name
└── projects[] ────────────────┐
                               │
Project                        │
├── id (UUID)                  │
├── name                       │
├── description                │
├── systemPrompt               │
├── userId ◄───────────────────┘
├── messages[] ────────────────┐
└── files[] ───────────────────┤
                               │
Message                        │
├── id (UUID)                  │
├── role (user/assistant)      │
├── content                    │
├── projectId ◄────────────────┤
└── createdAt                  │
                               │
File                           │
├── id (UUID)                  │
├── filename                   │
├── storedName                 │
├── path                       │
├── mimeType                   │
├── size                       │
└── projectId ◄────────────────┘
```

## Security Measures

### Authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Signed with secret key, 7-day expiration
- **Token Validation**: Every protected route verifies token

### Authorization
- **User Isolation**: Users can only access their own projects
- **Query Filtering**: All database queries filter by userId
- **Ownership Checks**: Update/Delete operations verify ownership

### Data Protection
- **Input Validation**: All inputs validated before processing
- **SQL Injection Prevention**: Prisma ORM uses parameterized queries
- **XSS Prevention**: Frontend escapes HTML in user content

### File Upload Security
- **File Type Validation**: Whitelist of allowed MIME types
- **Size Limits**: Maximum 10MB per file
- **Unique Filenames**: Prevents overwriting existing files

## Scalability Considerations

### Horizontal Scaling
- **Stateless Backend**: JWT auth allows multiple server instances
- **Database Pooling**: Prisma manages connection pools

### Performance Optimizations
- **Pagination**: Messages and files are paginated
- **Selective Loading**: Only fetch necessary data
- **Context Limiting**: Only last 20 messages sent to AI

### Future Improvements
- **Redis Cache**: For session data and frequent queries
- **Message Queue**: For async AI processing
- **CDN**: For static file delivery
- **Rate Limiting**: Prevent API abuse

## Extensibility

The architecture supports easy addition of:
- **Analytics**: Add middleware to log API usage
- **Integrations**: New services can be added to services/
- **Models**: New Prisma models for additional features
- **AI Providers**: Abstract AI service for multiple providers
