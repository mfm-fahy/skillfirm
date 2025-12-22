const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? '' 
    : 'http://localhost:5000');

export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL;

export const api = {
  baseURL: API_BASE_URL,
  socketURL: SOCKET_URL,
  endpoints: {
    auth: '/api/auth',
    tasks: '/api/tasks',
    community: '/api/community',
    ai: '/api/ai',
    courses: '/api/courses',
    newsletter: '/api/newsletter',
    realtime: '/api/realtime',
    users: '/api/users'
  }
};

export default API_BASE_URL;