'use client'
import { useRef, useState } from 'react'
import { analyzeFile } from '@/lib/api'
import type { AnalysisJob, ModelId } from '@/lib/types'

interface Props {
  models: ModelId[]
  onResult: (job: AnalysisJob) => void
  onError: (msg: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
}

const ACCEPTED = '.mp3,.wav,.ogg,.m4a,.mp4,.webm,.flac'

export default function FileUploader({ models, onResult, onError, loading, setLoading }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (f.size > 50 * 1024 * 1024) {
      onError('File quá lớn (tối đa 50MB)')
      return
    }
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    onError('')
    try {
      const job = await analyzeFile(file, 'file_upload', models)
      onResult(job)
    } catch (err: any) {
      onError(err.response?.data?.message ?? err.message ?? 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File ghi âm</label>
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
        onDrop={e => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {file ? (
          <div className="text-sm text-gray-700 dark:text-gray-200">
            <span className="font-medium">{file.name}</span>
            <span className="text-gray-400 dark:text-gray-500 ml-2">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
          </div>
        ) : (
          <div className="text-sm text-gray-400 dark:text-gray-500">
            Kéo thả file hoặc click để chọn
            <div className="text-xs mt-1">MP3, WAV, OGG, M4A, MP4, FLAC (tối đa 50MB)</div>
          </div>
        )}
      </div>
      {file && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Đang xử lý...' : 'Phân tích'}
        </button>
      )}
    </div>
  )
}
