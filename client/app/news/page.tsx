"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { ExternalLink, Clock, RefreshCw } from "lucide-react"
import API_BASE_URL from "@/lib/api"

interface NewsArticle {
  title: string
  description: string
  url: string
  urlToImage: string
  publishedAt: string
  source: string
  author: string
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      generateNews(parsedUser.selectedCareerField || 'Technology')
    }
  }, [])

  const generateNews = async (field: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field })
      })
      const data = await response.json()
      setNews(data.news || [])
    } catch (error) {
      console.error('Failed to generate news:', error)
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  const regenerateNews = () => {
    setRegenerating(true)
    generateNews(user?.selectedCareerField || 'Technology')
      .finally(() => setRegenerating(false))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen md:pt-0 pb-20 md:pb-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: "#5170ff" }}>
                Industry News
              </h1>
              <p className="text-gray-600">
                {user?.selectedCareerField 
                  ? `Latest news and trends in ${user.selectedCareerField}` 
                  : "Stay updated with the latest industry trends"
                }
              </p>
            </div>
            <button
              onClick={regenerateNews}
              disabled={regenerating}
              className="flex items-center gap-2 px-4 py-2 bg-[#5170ff] text-white rounded-lg hover:bg-[#4160ef] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Loading...' : 'Refresh News'}
            </button>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-lg border overflow-hidden">
                  <div className="animate-pulse">
                    <div className="bg-gray-300 h-48 w-full"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : news.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {news.map((article, index) => (
                <NewsCard key={index} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No news found for your field.</p>
              <button 
                onClick={regenerateNews}
                className="px-4 py-2 bg-[#5170ff] text-white rounded-lg hover:bg-[#4160ef]"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function NewsCard({ article }: { article: NewsArticle }) {
  const openArticle = () => {
    window.open(article.url, '_blank')
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
         onClick={openArticle}>
      {article.urlToImage && (
        <img 
          src={article.urlToImage} 
          alt={article.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-[#5170ff]">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {article.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{article.source}</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {article.author && (
            <span className="text-xs text-gray-500">By {article.author}</span>
          )}
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  )
}
