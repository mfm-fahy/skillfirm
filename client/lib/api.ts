const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: '/api/auth',
    tasks: '/api/tasks',
    community: '/api/community',
    ai: '/api/ai'
  }
};

export default API_BASE_URL;