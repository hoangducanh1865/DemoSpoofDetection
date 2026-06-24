'use client'
import { useState } from 'react'
import { analyzeYouTube } from '@/lib/api'
import type { AnalysisJob, ModelId } from '@/lib/types'

interface Props {
  models: ModelId[]
  onResult: (job: AnalysisJob) => void
  onError: (msg: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
}

export default function UrlAnalyzer({ models, onResult, onError, loading, setLoading }: Props) {
  const [url, setUrl] = useState('')

  const handleSubmit = async () => {
    if (!url.trim()) return
    setLoading(true)
    onError('')
    try {
      const job = await analyzeYouTube(url.trim(), models)
      onResult(job)
    } catch (err: any) {
      onError(err.response?.data?.message ?? err.message ?? 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">YouTube URL</label>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !url.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Đang xử lý...' : 'Phân tích'}
        </button>
      </div>
    </div>
  )
}
