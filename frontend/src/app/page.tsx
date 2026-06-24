'use client'
import { useState } from 'react'
import UrlAnalyzer from '@/components/UrlAnalyzer'
import FileUploader from '@/components/FileUploader'
import ModelSelector from '@/components/ModelSelector'
import DualResultCard from '@/components/DualResultCard'
import ThemeToggle from '@/components/ThemeToggle'
import type { AnalysisJob, ModelId } from '@/lib/types'

type Tab = 'youtube' | 'upload'

export default function HomePage() {
  const [tab, setTab]         = useState<Tab>('youtube')
  const [models, setModels]   = useState<ModelId[]>(['molex', 'aasist'])
  const [result, setResult]   = useState<AnalysisJob | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 py-12 px-4 transition-colors">
      <ThemeToggle />
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Speech Deepfake Detector</h1>
        </div>

        <div className="flex gap-2 mb-4 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border dark:border-gray-700">
          {(['youtube', 'upload'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
              {t === 'youtube' ? 'YouTube URL' : 'Upload / Ghi âm'}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-6 mb-4">
          <ModelSelector selected={models} onChange={setModels} />
          {tab === 'youtube'
            ? <UrlAnalyzer models={models} onResult={setResult}
                onError={msg => setError(msg || null)} loading={loading} setLoading={setLoading} />
            : <FileUploader models={models} onResult={setResult}
                onError={msg => setError(msg || null)} loading={loading} setLoading={setLoading} />
          }
        </div>

        {loading && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            Đang phân tích... (Cold start có thể mất 40-60 giây lần đầu)
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4 mb-4 text-sm">
            {error}
          </div>
        )}

        {result && !loading && <DualResultCard job={result} />}

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8">
          Kết quả mang tính tham khảo · Không dùng làm bằng chứng pháp lý
        </p>
      </div>
    </main>
  )
}
