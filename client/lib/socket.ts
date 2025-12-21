import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './api';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private userId: string | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    if (typeof window === 'undefined') return; // Skip on server-side

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      autoConnect: false
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join user room if userId is available
      if (this.userId) {
        this.joinUserRoom(this.userId);
      }
      
      this.emit('socket-connected', { socketId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('socket-disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('socket-error', { error: 'Max reconnection attempts reached' });
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.emit('socket-reconnected', { attemptNumber });
    });

    // Handle real-time events
    this.socket.on('news-updated', (data) => {
      this.emit('news-updated', data);
    });

    this.socket.on('courses-updated', (data) => {
      this.emit('courses-updated', data);
    });

    this.socket.on('post-created', (data) => {
      this.emit('post-created', data);
    });

    this.socket.on('post-like-updated', (data) => {
      this.emit('post-like-updated', data);
    });

    this.socket.on('new-chat-message', (data) => {
      this.emit('new-chat-message', data);
    });

    this.socket.on('task-updated', (data) => {
      this.emit('task-updated', data);
    });

    this.socket.on('task-completion-celebration', (data) => {
      this.emit('task-completion-celebration', data);
    });

    this.socket.on('progress-updated', (data) => {
      this.emit('progress-updated', data);
    });

    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });

    this.socket.on('new-discussion-message', (data) => {
      this.emit('new-discussion-message', data);
    });

    this.socket.on('user-joined-discussion', (data) => {
      this.emit('user-joined-discussion', data);
    });

    this.socket.on('user-left-discussion', (data) => {
      this.emit('user-left-discussion', data);
    });

    this.socket.on('user-typing', (data) => {
      this.emit('user-typing', data);
    });

    this.socket.on('new-skill-exchange', (data) => {
      this.emit('new-skill-exchange', data);
    });

    this.socket.on('new-mentorship-request', (data) => {
      this.emit('new-mentorship-request', data);
    });

    this.socket.on('milestone-celebration', (data) => {
      this.emit('milestone-celebration', data);
    });

    this.socket.on('new-ai-insight', (data) => {
      this.emit('new-ai-insight', data);
    });

    this.socket.on('subscription-confirmed', (data) => {
      this.emit('subscription-confirmed', data);
    });

    this.socket.on('user-status-changed', (data) => {
      this.emit('user-status-changed', data);
    });

    this.socket.on('system-announcement', (data) => {
      this.emit('system-announcement', data);
    });

    this.socket.on('heartbeat', (data) => {
      this.emit('heartbeat', data);
    });

    this.socket.on('connection-established', (data) => {
      this.emit('connection-established', data);
    });
  }

  // Public methods
  connect(userId?: string) {
    if (userId) {
      this.userId = userId;
    }
    
    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  joinUserRoom(userId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-user', userId);
      this.userId = userId;
    }
  }

  // News events
  sendNewsUpdate(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('news-update', data);
    }
  }

  // Course events
  sendCourseUpdate(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('course-update', data);
    }
  }

  sendCourseProgress(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('course-progress', data);
    }
  }

  // Community events
  sendNewPost(post: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('new-post', post);
    }
  }

  sendPostLike(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('post-liked', data);
    }
  }

  // Chat events
  sendChatMessage(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('chat-message', data);
    }
  }

  startTyping(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing-start', data);
    }
  }

  stopTyping(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing-stop', data);
    }
  }

  // Discussion events
  joinDiscussion(discussionId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-discussion', discussionId);
    }
  }

  leaveDiscussion(discussionId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-discussion', discussionId);
    }
  }

  sendDiscussionMessage(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('discussion-message', data);
    }
  }

  // Task events
  sendTaskUpdate(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('task-update', data);
    }
  }

  sendTaskCompletion(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('task-completed', data);
    }
  }

  // Skill exchange events
  sendSkillExchangeRequest(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('skill-exchange-request', data);
    }
  }

  // Mentorship events
  sendMentorshipRequest(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mentorship-request', data);
    }
  }

  // Career milestone events
  sendCareerMilestone(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('career-milestone', data);
    }
  }

  // AI insight events
  sendAIInsightGenerated(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('ai-insight-generated', data);
    }
  }

  // Newsletter events
  sendNewsletterSubscription(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('newsletter-subscribed', data);
    }
  }

  // Notification events
  sendNotification(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send-notification', data);
    }
  }

  // Status events
  sendStatusUpdate(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('status-update', data);
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }
    
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in socket event listener:', error);
        }
      });
    }
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  getUserId(): string | null {
    return this.userId;
  }
}

// Create singleton instance
const socketManager = new SocketManager();

export default socketManager;

// Export types for TypeScript
export interface SocketEventData {
  [key: string]: any;
}

export interface NewsUpdateData {
  field: string;
  articles: any[];
  updateType: string;
  timestamp: string;
}

export interface CourseUpdateData {
  field: string;
  courses: any[];
  updateType: string;
  timestamp: string;
}

export interface ChatMessageData {
  id: string;
  message: string;
  sender: string;
  targetUser?: string;
  chatType: string;
  timestamp: string;
}

export interface TaskUpdateData {
  taskId: string;
  status: string;
  progress: number;
  userId: string;
  timestamp: string;
}

export interface NotificationData {
  id: string;
  message: string;
  type: string;
  data: any;
  timestamp: string;
}