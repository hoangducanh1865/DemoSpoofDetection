'use client'
import { useState } from 'react'
import type { ModelId } from '@/lib/types'

interface Props {
  models: ModelId[]
  onFileSelected: (file: File) => void
}

const SAMPLES = {
  bonafide: [
    'T_0000000011.flac', 'T_0000000019.flac', 'T_0000000021.flac',
    'T_0000000028.flac', 'T_0000000049.flac', 'T_0000000054.flac',
    'T_0000000058.flac', 'T_0000000060.flac', 'T_0000000062.flac',
    'T_0000000085.flac',
  ],
  spoof: [
    'E_0000000024.flac', 'E_0000000034.flac', 'E_0000000076.flac',
    'E_0000000111.flac', 'E_0000000146.flac', 'E_0000000150.flac',
    'E_0000000166.flac', 'E_0000000167.flac', 'E_0000000168.flac',
    'E_0000000191.flac',
  ],
}

export default function SampleFiles({ onFileSelected }: Props) {
  const [open, setOpen] = useState(false)
  const [loadingFile, setLoadingFile] = useState<string | null>(null)

  const handleSelect = async (category: 'bonafide' | 'spoof', filename: string) => {
    setLoadingFile(filename)
    try {
      const res = await fetch(`/samples/${category}/${filename}`)
      const blob = await res.blob()
      const file = new File([blob], filename, { type: 'audio/flac' })
      onFileSelected(file)
    } finally {
      setLoadingFile(null)
    }
  }

  const downloadUrl = (category: 'bonafide' | 'spoof', filename: string) =>
    `/samples/${category}/${filename}`

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
      >
        Dùng file mẫu ASVspoof5 để test
      </button>
    )
  }

  return (
    <div className="mt-3 border dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
          File mẫu ASVspoof5 (click để phân tích, hoặc tải về)
        </span>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          Ẩn
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
            Bonafide (giọng thật)
          </div>
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {SAMPLES.bonafide.map(f => (
              <div key={f} className="flex items-center gap-1">
                <button
                  onClick={() => handleSelect('bonafide', f)}
                  disabled={loadingFile !== null}
                  className="text-xs text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 truncate disabled:opacity-50"
                >
                  {loadingFile === f ? '...' : f}
                </button>
                <a
                  href={downloadUrl('bonafide', f)}
                  download={f}
                  className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 flex-shrink-0"
                  title="Tải về"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
            Spoof (giọng AI)
          </div>
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {SAMPLES.spoof.map(f => (
              <div key={f} className="flex items-center gap-1">
                <button
                  onClick={() => handleSelect('spoof', f)}
                  disabled={loadingFile !== null}
                  className="text-xs text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 truncate disabled:opacity-50"
                >
                  {loadingFile === f ? '...' : f}
                </button>
                <a
                  href={downloadUrl('spoof', f)}
                  download={f}
                  className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 flex-shrink-0"
                  title="Tải về"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
