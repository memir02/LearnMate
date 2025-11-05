# LearnMate Backend API

Backend API for LearnMate educational platform built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 16.x or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup PostgreSQL database:
```bash
# Create a database named 'learnmate'
createdb learnmate

# Or using psql
psql -U postgres
CREATE DATABASE learnmate;
```

3. Configure environment variables:
```bash
# Copy .env.example to .env
cp .env.example .env

# Update DATABASE_URL in .env with your PostgreSQL credentials
DATABASE_URL="postgresql://username:password@localhost:5432/learnmate?schema=public"
```

4. Generate Prisma Client and run migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start development server:
```bash
npm run dev
```

The API will be running at `http://localhost:5000`

## 📚 API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)

### Users (`/api/users`) - Admin only

- `GET /api/users` - Get all users
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🗄️ Database Schema

See `prisma/schema.prisma` for full database schema.

## 🛠️ Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## 📝 Environment Variables

See `.env.example` for all available environment variables.

## 🔒 Authentication

API uses JWT (JSON Web Tokens) for authentication. Include token in Authorization header:

```
Authorization: Bearer <your-token>
```

## 👥 User Roles

- **ADMIN** - Full system access
- **TEACHER** - Create tests, manage classrooms, view student results
- **STUDENT** - Take tests, view results

## 📖 Technologies

- Node.js & Express
- TypeScript
- PostgreSQL & Prisma ORM
- JWT Authentication
- bcryptjs for password hashing
- Zod for validation








