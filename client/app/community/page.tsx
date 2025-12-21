"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Heart, MessageCircle, Plus, Search, Filter, TrendingUp, Users, Award, Lightbulb, Share2, Eye, Bookmark, BookmarkCheck, Zap, Target, Crown, Flame, Star, Calendar, Clock, ThumbsUp, Send, Image, Video, Poll, Mic, MapPin, Globe, Briefcase, GraduationCap, Coffee, Handshake, Rocket, Brain } from "lucide-react"
import { useCommunitySocket } from "@/hooks/use-socket"
import API_BASE_URL from "@/lib/api"

interface Post {
  _id: string
  title: string
  content: string
  category: string
  author: {
    id: string
    name: string
    avatar: string
    field?: string
    level?: string
    verified?: boolean
    reputation?: number
  }
  likes: string[]
  comments: Array<{
    _id?: string
    author: {
      id: string
      name: string
      avatar: string
    }
    content: string
    createdAt: string
    likes?: number
  }>
  views?: number
  createdAt: string
  tags?: string[]
  isBookmarked?: boolean
  isPinned?: boolean
  hasMedia?: boolean
  mediaType?: 'image' | 'video' | 'poll'
  location?: string
  engagement?: {
    score: number
    trending: boolean
    hotness: number
  }
  mentorship?: {
    isMentorPost: boolean
    seekingMentor: boolean
    offeringMentorship: boolean
  }
}

interface CommunityStats {
  totalPosts: number
  totalMembers: number
  activeToday: number
  topContributors: Array<{
    name: string
    avatar: string
    posts: number
    reputation: number
    level: string
  }>
  weeklyGrowth: number
  engagementRate: number
  trendingTopics: string[]
  mentorshipConnections: number
  skillExchanges: number
  careerMilestones: number
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newPost, setNewPost] = useState({ 
    title: "", 
    content: "", 
    category: "", 
    tags: "",
    location: "",
    mentorship: {
      isMentorPost: false,
      seekingMentor: false,
      offeringMentorship: false
    }
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTab, setActiveTab] = useState("feed")
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([])
  const [showComments, setShowComments] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest')
  const [filterByField, setFilterByField] = useState("all")
  const [mentorshipMode, setMentorshipMode] = useState(false)
  const [liveDiscussions, setLiveDiscussions] = useState<any[]>([])
  const [expertSessions, setExpertSessions] = useState<any[]>([])
  const [communityEvents, setCommunityEvents] = useState<any[]>([])
  const [skillExchanges, setSkillExchanges] = useState<any[]>([])
  const [careerMilestones, setCareerMilestones] = useState<any[]>([])
  const [networkingOpportunities, setNetworkingOpportunities] = useState<any[]>([])
  const { newPosts, postLikes, skillExchanges: socketSkillExchanges, mentorshipRequests, milestones, isConnected } = useCommunitySocket()
  useEffect(() => {
    fetchPosts()
    fetchCommunityStats()
    fetchLiveDiscussions()
    fetchExpertSessions()
    fetchCommunityEvents()
    
    // Load saved events from MongoDB
    const token = localStorage.getItem('token')
    if (token) {
      fetchCommunityEvents()
    }
  }, [])

  useEffect(() => {
    filterPosts()
  }, [posts, searchQuery, selectedCategory])

  // Handle real-time new posts
  useEffect(() => {
    if (newPosts.length > 0) {
      const latestPost = newPosts[0]
      setPosts(prevPosts => {
        const exists = prevPosts.some(post => post._id === latestPost._id)
        if (!exists) {
          return [latestPost, ...prevPosts]
        }
        return prevPosts
      })
    }
  }, [newPosts])

  // Handle real-time post likes
  useEffect(() => {
    if (postLikes.length > 0) {
      const latestLike = postLikes[0]
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === latestLike.postId
            ? { ...post, likes: [...post.likes, latestLike.userId] }
            : post
        )
      )
    }
  }, [postLikes])

  // Handle real-time skill exchanges
  useEffect(() => {
    if (socketSkillExchanges.length > 0) {
      setSkillExchanges(prev => [socketSkillExchanges[0], ...prev])
    }
  }, [socketSkillExchanges])

  // Handle real-time mentorship requests
  useEffect(() => {
    if (mentorshipRequests.length > 0) {
      console.log('New mentorship request:', mentorshipRequests[0])
    }
  }, [mentorshipRequests])

  // Handle real-time milestones
  useEffect(() => {
    if (milestones.length > 0) {
      setCareerMilestones(prev => [milestones[0], ...prev])
    }
  }, [milestones])

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/community/posts`)
      const data = await response.json()
      setPosts(data.posts)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCommunityStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/community/stats`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchLiveDiscussions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/community/live-discussions`)
      const data = await response.json()
      setLiveDiscussions(data.discussions || [])
    } catch (error) {
      console.error('Failed to fetch live discussions:', error)
    }
  }

  const fetchExpertSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/community/expert-sessions`)
      const data = await response.json()
      setExpertSessions(data.sessions || [])
    } catch (error) {
      console.error('Failed to fetch expert sessions:', error)
    }
  }

  const fetchCommunityEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/community/events`)
      const data = await response.json()
      setCommunityEvents(data.events || [])
    } catch (error) {
      console.error('Failed to fetch community events:', error)
    }
  }

  const filterPosts = () => {
    let filtered = posts
    
    if (searchQuery) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory)
    }
    
    setFilteredPosts(filtered)
  }

  const createPost = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPost)
      })

      if (response.ok) {
        setNewPost({ title: "", content: "", category: "" })
        setIsCreateOpen(false)
        fetchPosts()
      }
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  const likePost = async (postId: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      await fetch(`${API_BASE_URL}/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      fetchPosts()
    } catch (error) {
      console.error('Failed to like post:', error)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      career_update: "bg-blue-100 text-blue-800",
      solution: "bg-green-100 text-green-800",
      question: "bg-yellow-100 text-yellow-800",
      tip: "bg-purple-100 text-purple-800",
      achievement: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800"
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen md:pt-0 pb-20 md:pb-8 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Community Hub
              </h1>
              <p className="text-gray-600">Connect, share, and grow with fellow professionals</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`flex items-center gap-1 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}></div>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Post title"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  />
                  <Select onValueChange={(value) => setNewPost({ ...newPost, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="career_update">Career Update</SelectItem>
                      <SelectItem value="solution">Solution</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="tip">Tip</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={4}
                  />
                  <Button 
                    onClick={createPost}
                    disabled={!newPost.title || !newPost.content || !newPost.category}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Create Post
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Community Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Community Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Posts</span>
                    <span className="font-semibold">{posts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Members</span>
                    <span className="font-semibold">{stats?.totalMembers || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Today</span>
                    <span className="font-semibold text-green-600">{isConnected ? 1 : 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {newPosts.length > 0 ? (
                    newPosts.slice(0, 3).map((post, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{post.title}</p>
                          <p className="text-xs text-gray-500">by {post.author?.name}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Career Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Career Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {milestones.length > 0 ? (
                    milestones.slice(0, 2).map((milestone, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                            <Crown className="w-3 h-3 text-orange-600" />
                          </div>
                          <span className="text-sm font-medium">{milestone.user || 'Community Member'}</span>
                        </div>
                        <p className="text-sm text-gray-600">{milestone.achievement || 'Career Achievement'}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString()}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No milestones yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Search and Filter */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full md:w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="career_update">Career Updates</SelectItem>
                        <SelectItem value="solution">Solutions</SelectItem>
                        <SelectItem value="question">Questions</SelectItem>
                        <SelectItem value="tip">Tips</SelectItem>
                        <SelectItem value="achievement">Achievements</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="w-full flex flex-wrap gap-2 h-auto p-2 bg-transparent">
                  <TabsTrigger value="feed" className="flex items-center gap-1 text-xs px-3 py-2">
                    <TrendingUp className="w-3 h-3" />
                    Latest
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="flex items-center gap-1 text-xs px-3 py-2">
                    <Heart className="w-3 h-3" />
                    Popular
                  </TabsTrigger>
                  <TabsTrigger value="mentorship" className="flex items-center gap-1 text-xs px-3 py-2">
                    <Handshake className="w-3 h-3" />
                    Mentor
                  </TabsTrigger>
                  <TabsTrigger value="events" className="flex items-center gap-1 text-xs px-3 py-2">
                    <Calendar className="w-3 h-3" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="flex items-center gap-1 text-xs px-3 py-2">
                    <Brain className="w-3 h-3" />
                    Skills
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="feed" className="mt-6">
                  <PostsList posts={filteredPosts} loading={loading} onLike={likePost} />
                </TabsContent>

                <TabsContent value="popular" className="mt-6">
                  <PostsList 
                    posts={filteredPosts.sort((a, b) => b.likes.length - a.likes.length)} 
                    loading={loading} 
                    onLike={likePost} 
                  />
                </TabsContent>

                <TabsContent value="mentorship" className="mt-6">
                  <MentorshipHub posts={filteredPosts} onLike={likePost} />
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                  <CommunityEvents events={communityEvents} setCommunityEvents={setCommunityEvents} />
                </TabsContent>

                <TabsContent value="skills" className="mt-6">
                  <SkillExchange exchanges={skillExchanges} />
                </TabsContent>

                <TabsContent value="trending" className="mt-6">
                  <PostsList 
                    posts={filteredPosts.sort((a, b) => (b.views || 0) - (a.views || 0))} 
                    loading={loading} 
                    onLike={likePost} 
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

function PostsList({ posts, loading, onLike }: {
  posts: Post[]
  loading: boolean
  onLike: (postId: string) => void
}) {

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No posts found. Be the first to share something!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onLike={onLike} />
      ))}
    </div>
  )
}

function PostCard({ post, onLike }: { post: Post; onLike: (postId: string) => void }) {
  const getCategoryColor = (category: string) => {
    const colors = {
      career_update: "bg-blue-100 text-blue-800",
      solution: "bg-green-100 text-green-800",
      question: "bg-yellow-100 text-yellow-800",
      tip: "bg-purple-100 text-purple-800",
      achievement: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800"
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.author.name}</p>
              {post.author.field && (
                <p className="text-sm text-gray-500">{post.author.field}</p>
              )}
              <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getCategoryColor(post.category)}>
              {post.category.replace('_', ' ')}
            </Badge>
            {post.views && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Eye className="w-3 h-3" />
                {post.views}
              </div>
            )}
          </div>
        </div>
        <CardTitle className="text-xl mt-3">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post._id)}
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              <Heart className="w-4 h-4 mr-1" />
              {post.likes.length}
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-4 h-4 mr-1" />
              {post.comments.length}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500 transition-colors">
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MentorshipHub({ posts, onLike }: { posts: Post[]; onLike: (postId: string) => void }) {
  const mentorshipPosts = posts.filter(post => 
    post.mentorship?.isMentorPost || 
    post.mentorship?.seekingMentor || 
    post.mentorship?.offeringMentorship
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100">
          <CardContent className="p-4 text-center">
            <Handshake className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-900">Find a Mentor</h3>
            <p className="text-sm text-blue-700">Connect with experienced professionals</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-900">Become a Mentor</h3>
            <p className="text-sm text-green-700">Share your expertise with others</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-violet-100">
          <CardContent className="p-4 text-center">
            <Rocket className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-900">Peer Learning</h3>
            <p className="text-sm text-purple-700">Learn together with peers</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        {mentorshipPosts.length > 0 ? (
          mentorshipPosts.map(post => (
            <PostCard key={post._id} post={post} onLike={onLike} />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Handshake className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No mentorship opportunities yet. Be the first to create one!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function CommunityEvents({ events, setCommunityEvents }: { events: any[]; setCommunityEvents: (events: any[]) => void }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: ''
  })

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) return
    
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/community/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEvent)
      })
      
      if (response.ok) {
        const data = await response.json()
        setCommunityEvents(prev => [data.event, ...prev])
        setNewEvent({ title: '', description: '', date: '', time: '' })
        setIsCreateOpen(false)
      }
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const joinEvent = async (eventId: string) => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      await fetch(`${API_BASE_URL}/api/community/events/${eventId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setCommunityEvents(prev => 
        prev.map(event => 
          event._id === eventId 
            ? { ...event, attendees: (event.attendees || 0) + 1 }
            : event
        )
      )
    } catch (error) {
      console.error('Failed to join event:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Community Events</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Event title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <Textarea
                placeholder="Event description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
              <Input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
              <Input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              />
              <Button onClick={createEvent} className="w-full">
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {events.length > 0 ? (
        events.map((event, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-3">{event.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {event.attendees} attending
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={() => joinEvent(event.id)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  Join Event
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming events. Create the first one!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SkillExchange({ exchanges }: { exchanges: any[] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-orange-50 to-red-100">
          <CardContent className="p-4 text-center">
            <Brain className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-orange-900">Teach a Skill</h3>
            <p className="text-sm text-orange-700">Share your expertise</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-100">
          <CardContent className="p-4 text-center">
            <Lightbulb className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <h3 className="font-semibold text-teal-900">Learn a Skill</h3>
            <p className="text-sm text-teal-700">Discover new abilities</p>
          </CardContent>
        </Card>
      </div>
      
      {exchanges.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {exchanges.map((exchange, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{exchange.user?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{exchange.user}</p>
                    <p className="text-sm text-gray-500">{exchange.type}</p>
                  </div>
                </div>
                <h4 className="font-semibold mb-2">{exchange.skill}</h4>
                <p className="text-sm text-gray-600 mb-3">{exchange.description}</p>
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{exchange.level}</Badge>
                  <Button size="sm" variant="outline">
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No skill exchanges available. Start one!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
