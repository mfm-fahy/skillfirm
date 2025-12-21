import { useEffect, useRef, useCallback, useState } from 'react'
import socketManager from '@/lib/socket'
import type { SocketEventData } from '@/lib/socket'

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState(0)
  const eventListenersRef = useRef<Map<string, Function>>(new Map())

  useEffect(() => {
    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)
    const handleHeartbeat = (data: any) => {
      if (data?.activeUsers) setActiveUsers(data.activeUsers)
    }

    socketManager.on('socket-connected', handleConnect)
    socketManager.on('socket-disconnected', handleDisconnect)
    socketManager.on('heartbeat', handleHeartbeat)

    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      if (token && userData) {
        const user = JSON.parse(userData)
        socketManager.connect(user?.id)
      }
    } catch (e) {
      // ignore parse errors
    }

    return () => {
      socketManager.off('socket-connected', handleConnect)
      socketManager.off('socket-disconnected', handleDisconnect)
      socketManager.off('heartbeat', handleHeartbeat)
    }
  }, [])

  const connect = useCallback((userId?: string) => {
    socketManager.connect(userId)
  }, [])

  const disconnect = useCallback(() => {
    socketManager.disconnect()
  }, [])

  const on = useCallback((event: string, callback: Function) => {
    socketManager.on(event, callback)
    eventListenersRef.current.set(event, callback)
  }, [])

  const off = useCallback((event: string) => {
    const callback = eventListenersRef.current.get(event)
    if (callback) {
      socketManager.off(event, callback)
      eventListenersRef.current.delete(event)
    }
  }, [])

  const emit = useCallback((event: string, data: any) => {
    switch (event) {
      case 'news-update':
        socketManager.sendNewsUpdate(data)
        break
      case 'course-update':
        socketManager.sendCourseUpdate(data)
        break
      case 'course-progress':
        socketManager.sendCourseProgress(data)
        break
      case 'new-post':
        socketManager.sendNewPost(data)
        break
      case 'post-liked':
        socketManager.sendPostLike(data)
        break
      case 'chat-message':
        socketManager.sendChatMessage(data)
        break
      case 'task-update':
        socketManager.sendTaskUpdate(data)
        break
      case 'task-completed':
        socketManager.sendTaskCompletion(data)
        break
      case 'skill-exchange-request':
        socketManager.sendSkillExchangeRequest(data)
        break
      case 'mentorship-request':
        socketManager.sendMentorshipRequest(data)
        break
      case 'career-milestone':
        socketManager.sendCareerMilestone(data)
        break
      case 'ai-insight-generated':
        socketManager.sendAIInsightGenerated(data)
        break
      case 'newsletter-subscribed':
        socketManager.sendNewsletterSubscription(data)
        break
      case 'send-notification':
        socketManager.sendNotification(data)
        break
      case 'status-update':
        socketManager.sendStatusUpdate(data)
        break
      case 'join-discussion':
        socketManager.joinDiscussion(data)
        break
      case 'leave-discussion':
        socketManager.leaveDiscussion(data)
        break
      case 'discussion-message':
        socketManager.sendDiscussionMessage(data)
        break
      case 'typing-start':
        socketManager.startTyping(data)
        break
      case 'typing-stop':
        socketManager.stopTyping(data)
        break
      default:
        console.warn('Unknown socket event:', event)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventListenersRef.current.forEach((callback, event) => {
        socketManager.off(event, callback)
      })
      eventListenersRef.current.clear()
    }
  }, [])

  return {
    isConnected,
    activeUsers,
    connect,
    disconnect,
    on,
    off,
    emit,
    socketId: socketManager.getSocketId(),
    userId: socketManager.getUserId(),
  }
}

// Specialized hooks for different features
export function useNewsSocket() {
  const { on, off, emit, isConnected } = useSocket()
  const [newsUpdates, setNewsUpdates] = useState<any[]>([])

  useEffect(() => {
    const handleNewsUpdate = (data: any) => {
      setNewsUpdates(prev => [data, ...prev.slice(0, 9)])
    }

    on('news-updated', handleNewsUpdate)

    return () => {
      off('news-updated')
    }
  }, [on, off])

  const sendNewsUpdate = useCallback((data: any) => {
    emit('news-update', data)
  }, [emit])

  return { newsUpdates, sendNewsUpdate, isConnected }
}

export function useCourseSocket() {
  const { on, off, emit, isConnected } = useSocket()
  const [courseUpdates, setCourseUpdates] = useState<any[]>([])
  const [progressUpdates, setProgressUpdates] = useState<any[]>([])

  useEffect(() => {
    const handleCourseUpdate = (data: any) => {
      setCourseUpdates(prev => [data, ...prev.slice(0, 9)])
    }

    const handleProgressUpdate = (data: any) => {
      setProgressUpdates(prev => [data, ...prev.slice(0, 9)])
    }

    on('courses-updated', handleCourseUpdate)
    on('progress-updated', handleProgressUpdate)

    return () => {
      off('courses-updated')
      off('progress-updated')
    }
  }, [on, off])

  const sendCourseUpdate = useCallback((data: any) => {
    emit('course-update', data)
  }, [emit])

  const sendProgressUpdate = useCallback((data: any) => {
    emit('course-progress', data)
  }, [emit])

  return { courseUpdates, progressUpdates, sendCourseUpdate, sendProgressUpdate, isConnected }
}

export function useCommunitySocket() {
  const { on, off, emit, isConnected } = useSocket()
  const [newPosts, setNewPosts] = useState<any[]>([])
  const [postLikes, setPostLikes] = useState<any[]>([])
  const [skillExchanges, setSkillExchanges] = useState<any[]>([])
  const [mentorshipRequests, setMentorshipRequests] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])

  useEffect(() => {
    const handleNewPost = (data: any) => setNewPosts(prev => [data, ...prev.slice(0, 9)])
    const handlePostLike = (data: any) => setPostLikes(prev => [data, ...prev.slice(0, 9)])
    const handleSkillExchange = (data: any) => setSkillExchanges(prev => [data, ...prev.slice(0, 9)])
    const handleMentorshipRequest = (data: any) => setMentorshipRequests(prev => [data, ...prev.slice(0, 9)])
    const handleMilestone = (data: any) => setMilestones(prev => [data, ...prev.slice(0, 9)])

    on('post-created', handleNewPost)
    on('post-like-updated', handlePostLike)
    on('new-skill-exchange', handleSkillExchange)
    on('new-mentorship-request', handleMentorshipRequest)
    on('milestone-celebration', handleMilestone)

    return () => {
      off('post-created')
      off('post-like-updated')
      off('new-skill-exchange')
      off('new-mentorship-request')
      off('milestone-celebration')
    }
  }, [on, off])

  const sendNewPost = useCallback((data: any) => emit('new-post', data), [emit])
  const sendPostLike = useCallback((data: any) => emit('post-liked', data), [emit])
  const sendSkillExchange = useCallback((data: any) => emit('skill-exchange-request', data), [emit])
  const sendMentorshipRequest = useCallback((data: any) => emit('mentorship-request', data), [emit])
  const sendMilestone = useCallback((data: any) => emit('career-milestone', data), [emit])

  return {
    newPosts,
    postLikes,
    skillExchanges,
    mentorshipRequests,
    milestones,
    sendNewPost,
    sendPostLike,
    sendSkillExchange,
    sendMentorshipRequest,
    sendMilestone,
    isConnected,
  }
}

export function useChatSocket() {
  const { on, off, emit, isConnected } = useSocket()
  const [messages, setMessages] = useState<any[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleNewMessage = (data: any) => setMessages(prev => [...prev, data])
    const handleTyping = (data: any) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        if (data.isTyping) newSet.add(data.userId)
        else newSet.delete(data.userId)
        return newSet
      })
    }

    on('new-chat-message', handleNewMessage)
    on('user-typing', handleTyping)

    return () => {
      off('new-chat-message')
      off('user-typing')
    }
  }, [on, off])

  const sendMessage = useCallback((data: any) => emit('chat-message', data), [emit])
  const startTyping = useCallback((data: any) => emit('typing-start', data), [emit])
  const stopTyping = useCallback((data: any) => emit('typing-stop', data), [emit])

  return { messages, typingUsers: Array.from(typingUsers), sendMessage, startTyping, stopTyping, isConnected }
}

export function useTaskSocket() {
  const { on, off, emit, isConnected } = useSocket()
  const [taskUpdates, setTaskUpdates] = useState<any[]>([])
  const [completionCelebrations, setCompletionCelebrations] = useState<any[]>([])

  useEffect(() => {
    const handleTaskUpdate = (data: any) => setTaskUpdates(prev => [data, ...prev.slice(0, 9)])
    const handleTaskCompletion = (data: any) => setCompletionCelebrations(prev => [data, ...prev.slice(0, 4)])

    on('task-updated', handleTaskUpdate)
    on('task-completion-celebration', handleTaskCompletion)

    return () => {
      off('task-updated')
      off('task-completion-celebration')
    }
  }, [on, off])

  const sendTaskUpdate = useCallback((data: any) => emit('task-update', data), [emit])
  const sendTaskCompletion = useCallback((data: any) => emit('task-completed', data), [emit])

  return { taskUpdates, completionCelebrations, sendTaskUpdate, sendTaskCompletion, isConnected }
}

export function useNotificationSocket() {
  const { on, off, emit, isConnected } = useSocket()
  const [notifications, setNotifications] = useState<any[]>([])
  const [systemAnnouncements, setSystemAnnouncements] = useState<any[]>([])

  useEffect(() => {
    const handleNotification = (data: any) => setNotifications(prev => [data, ...prev.slice(0, 19)])
    const handleSystemAnnouncement = (data: any) => setSystemAnnouncements(prev => [data, ...prev.slice(0, 4)])

    on('notification', handleNotification)
    on('system-announcement', handleSystemAnnouncement)

    return () => {
      off('notification')
      off('system-announcement')
    }
  }, [on, off])

  const sendNotification = useCallback((data: any) => emit('send-notification', data), [emit])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notif => (notif.id === notificationId ? { ...notif, read: true } : notif)))
  }, [])

  const clearNotifications = useCallback(() => setNotifications([]), [])

  return {
    notifications,
    systemAnnouncements,
    unreadCount: notifications.filter(n => !n.read).length,
    sendNotification,
    markAsRead,
    clearNotifications,
    isConnected,
  }
}