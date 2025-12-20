# SkillFarm v8 - Career Guidance Platform

A comprehensive career guidance platform with AI-powered analysis and multi-step user registration.

## Features

✅ **Multi-Step Registration Process**
- Basic information collection (name, email, phone, degree, avatar)
- User type selection (School Student, College Student, Employee)
- Career field analysis using OpenRouter AI
- Psychometric testing for career guidance
- Personalized recommendations

✅ **AI-Powered Career Analysis**
- Field value assessment and growth potential
- Alternative career suggestions
- Psychometric personality analysis
- Employee career development paths

✅ **User Types Supported**
- **School Students**: Career exploration with psychometric testing
- **College Students**: Field analysis and career planning
- **Employees**: Career switching or development guidance

## Setup Instructions

### 1. Server Setup

```bash
cd server
npm install
```

### 2. Environment Configuration

Update `server/.env` with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skillfarm
JWT_SECRET=your-secure-jwt-secret
OPENROUTER_API_KEY=your-openrouter-api-key
```

Get your OpenRouter API key from: https://openrouter.ai/

### 3. Database Setup

Make sure MongoDB is running on your system:
```bash
# Start MongoDB (Windows)
net start MongoDB

# Or start MongoDB service manually
mongod
```

### 4. Start Server

```bash
cd server
npm run dev
```

### 5. Client Setup

```bash
cd client
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register/basic` - Step 1: Basic information
- `POST /api/auth/register/usertype` - Step 2: User type selection
- `POST /api/auth/register/school-analysis` - School student analysis
- `POST /api/auth/register/college-analysis` - College student analysis
- `POST /api/auth/register/employee-analysis` - Employee analysis
- `POST /api/auth/register/psychometric-test` - Psychometric test submission
- `POST /api/auth/register/complete` - Complete registration
- `POST /api/auth/login` - User login

### Utilities
- `GET /api/auth/career-fields` - Get available career fields
- `GET /api/auth/psychometric-test` - Get psychometric test questions

## User Flow

1. **Basic Information**: Name, email, phone, degree, avatar selection
2. **User Type Selection**: Choose between School/College/Employee
3. **Career Analysis**: 
   - School: Career idea check → Field analysis or Psychometric test
   - College: Field analysis and future prospects
   - Employee: Current field analysis and development/switching options
4. **AI Analysis**: OpenRouter provides personalized recommendations
5. **Registration Complete**: User enters the main application

## Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **AI Integration**: OpenRouter API
- **Authentication**: JWT tokens
- **UI Components**: Shadcn/ui

## Database Schema

The User model includes:
- Basic info (name, email, phone, avatar)
- Education details (degree, school group)
- User type and career preferences
- AI analysis results
- Psychometric test results
- Employee-specific information

## Notes

- The application uses temporary storage for multi-step registration
- AI fallback responses are provided for development/testing
- All user data is stored in MongoDB after registration completion
- JWT tokens are used for authentication with 7-day expiry"# skillfirm" 
"# skillfirm" 
"# skillfirm" 
