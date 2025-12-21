"use client"

import { useState, useEffect } from "react"
import { Play, AlertCircle, CheckCircle } from "lucide-react"

interface ThumbnailTestProps {
  videoId: string
  title?: string
}

export function YouTubeThumbnailTest({ videoId, title = "Test Video" }: ThumbnailTestProps) {
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  // Available YouTube thumbnail sizes
  const thumbnailSizes = {
    'default': `https://img.youtube.com/vi/${videoId}/default.jpg`, // 120x90
    'medium': `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, // 320x180 (BEST)
    'high': `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, // 480x360
    'standard': `https://img.youtube.com/vi/${videoId}/sddefault.jpg`, // 640x480
    'maxres': `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` // 1280x720
  }

  // Test thumbnail URL availability
  const testThumbnailUrl = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
      // Timeout after 3 seconds
      setTimeout(() => resolve(false), 3000)
    })
  }

  useEffect(() => {
    const testAllThumbnails = async () => {
      setLoading(true)
      const testResults: Record<string, boolean> = {}
      
      for (const [size, url] of Object.entries(thumbnailSizes)) {
        const works = await testThumbnailUrl(url)
        testResults[size] = works
      }
      
      setResults(testResults)
      setLoading(false)
    }

    testAllThumbnails()
  }, [videoId])

  const getBestThumbnail = (): string => {
    // Priority order: medium (recommended) -> high -> default -> standard -> maxres
    const priority = ['medium', 'high', 'default', 'standard', 'maxres']
    
    for (const size of priority) {
      if (results[size]) {
        return thumbnailSizes[size as keyof typeof thumbnailSizes]
      }
    }
    
    return thumbnailSizes.medium // fallback
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="animate-pulse">
          <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Best Thumbnail Display */}
      <div className="relative">
        <img 
          src={getBestThumbnail()}
          alt={title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            console.error('Thumbnail failed to load:', e.currentTarget.src)
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">Video ID: {videoId}</p>
        
        {/* Thumbnail Test Results */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Thumbnail Availability:</h4>
          {Object.entries(thumbnailSizes).map(([size, url]) => (
            <div key={size} className="flex items-center justify-between text-sm">
              <span className="capitalize">{size} ({getSizeDescription(size)}):</span>
              <div className="flex items-center gap-2">
                {results[size] ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={results[size] ? 'text-green-600' : 'text-red-600'}>
                  {results[size] ? 'Available' : 'Failed'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Best Thumbnail Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            <strong>Best thumbnail:</strong> {getBestThumbnailSize()} 
            ({getSizeDescription(getBestThumbnailSize())})
          </p>
          <p className="text-xs text-blue-600 mt-1">
            URL: {getBestThumbnail()}
          </p>
        </div>
      </div>
    </div>
  )

  function getSizeDescription(size: string): string {
    const descriptions = {
      'default': '120x90',
      'medium': '320x180 - RECOMMENDED',
      'high': '480x360',
      'standard': '640x480',
      'maxres': '1280x720'
    }
    return descriptions[size as keyof typeof descriptions] || 'Unknown'
  }

  function getBestThumbnailSize(): string {
    const priority = ['medium', 'high', 'default', 'standard', 'maxres']
    
    for (const size of priority) {
      if (results[size]) {
        return size
      }
    }
    
    return 'medium'
  }
}