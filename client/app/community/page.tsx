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
import { Heart, MessageCircle, Plus } from "lucide-react"

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
  }
  likes: string[]
  comments: Array<{
    author: {
      id: string
      name: string
      avatar: string
    }
    content: string
    createdAt: string
  }>
  createdAt: string
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/community/posts')
      const data = await response.json()
      setPosts(data.posts)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('http://localhost:5000/api/community/posts', {
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
      await fetch(`http://localhost:5000/api/community/posts/${postId}/like`, {
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
      <main className="min-h-screen md:pt-0 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: "#5170ff" }}>
                Community
              </h1>
              <p className="text-gray-600">Share updates, solutions, and connect with peers</p>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#5170ff] hover:bg-[#4060ef]">
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
                    className="w-full bg-[#5170ff] hover:bg-[#4060ef]"
                  >
                    Create Post
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
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
          ) : (
            <div className="space-y-6">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No posts yet. Be the first to share something!</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post._id} className="hover:shadow-md transition-shadow">
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
                        <Badge className={getCategoryColor(post.category)}>
                          {post.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mt-3">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>
                      <div className="flex items-center space-x-4 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likePost(post._id)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          {post.likes.length}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.comments.length}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
