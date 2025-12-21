"use client"

import { useState } from "react"
import { YouTubeThumbnailTest } from "@/components/youtube-thumbnail-test"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"

export default function ThumbnailTestPage() {
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ') // Rick Roll as default test
  const [testVideoId, setTestVideoId] = useState(videoId)

  // Common test video IDs
  const testVideos = [
    { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up' },
    { id: 'jNQXAC9IVRw', title: 'Me at the zoo (First YouTube video)' },
    { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito' },
    { id: 'fJ9rUzIMcZQ', title: 'Gangnam Style' },
    { id: 'invalid123', title: 'Invalid Video ID (Test Error Handling)' }
  ]

  const extractVideoId = (input: string): string => {
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ]

    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match) return match[1]
    }

    return input // Return as-is if no pattern matches
  }

  const handleTest = () => {
    const id = extractVideoId(videoId)
    setTestVideoId(id)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen md:pt-0 pb-20 md:pb-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: "#5170ff" }}>
              YouTube Thumbnail Test
            </h1>
            <p className="text-gray-600">
              Test YouTube thumbnail availability and verify implementation
            </p>
          </div>

          {/* Input Section */}
          <div className="bg-white rounded-lg border p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Video</h2>
            <div className="flex gap-2 mb-4">
              <Input
                type="text"
                placeholder="Enter YouTube URL or Video ID"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleTest} className="bg-[#5170ff] hover:bg-[#4160ef]">
                Test
              </Button>
            </div>
            
            {/* Quick Test Buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Quick Tests:</p>
              <div className="flex flex-wrap gap-2">
                {testVideos.map((video) => (
                  <Button
                    key={video.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVideoId(video.id)
                      setTestVideoId(video.id)
                    }}
                    className="text-xs"
                  >
                    {video.title}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <YouTubeThumbnailTest 
              videoId={testVideoId} 
              title={testVideos.find(v => v.id === testVideoId)?.title || `Video ${testVideoId}`}
            />
          </div>

          {/* Implementation Guide */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Implementation Guide</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-green-600 mb-2">✅ Correct Implementation</h3>
                <div className="bg-green-50 p-3 rounded font-mono text-xs">
                  {`// Use snippet.thumbnails.medium.url (BEST PRACTICE)
video.snippet.thumbnails.medium.url   // 320x180 (RECOMMENDED)
video.snippet.thumbnails.high.url     // 480x360
video.snippet.thumbnails.default.url  // 120x90

// Always ensure HTTPS
thumbnailUrl.replace('http://', 'https://')`}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-red-600 mb-2">❌ Common Mistakes</h3>
                <div className="bg-red-50 p-3 rounded font-mono text-xs">
                  {`// Wrong path
video.thumbnail.url  // ❌ Incorrect

// HTTP instead of HTTPS
"http://i.ytimg.com/vi/VIDEO_ID/mqdefault.jpg"  // ❌ Blocked by browser

// Not handling API errors
if (!video.snippet?.thumbnails) {
  // Handle missing thumbnails
}`}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-blue-600 mb-2">🔧 Error Handling</h3>
                <div className="bg-blue-50 p-3 rounded font-mono text-xs">
                  {`// React safe rendering
{video?.snippet?.thumbnails?.medium?.url && (
  <img
    src={video.snippet.thumbnails.medium.url}
    alt={video.snippet.title}
    onError={handleImageError}
  />
)}

// Fallback URLs
const fallbackUrl = \`https://img.youtube.com/vi/\${videoId}/mqdefault.jpg\``}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}