'use client'
import { useRef, useState } from 'react'
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

function PlayIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zm7 0a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

export default function SampleFiles({ onFileSelected }: Props) {
  const [open, setOpen] = useState(false)
  const [loadingFile, setLoadingFile] = useState<string | null>(null)
  const [playingFile, setPlayingFile] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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

  const togglePlay = (category: 'bonafide' | 'spoof', filename: string) => {
    const url = `/samples/${category}/${filename}`
    if (playingFile === filename) {
      audioRef.current?.pause()
      setPlayingFile(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(url)
    audio.onended = () => setPlayingFile(null)
    audio.play()
    audioRef.current = audio
    setPlayingFile(filename)
  }

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

  const renderFile = (category: 'bonafide' | 'spoof', f: string) => (
    <div key={f} className="flex items-center gap-1">
      <button
        onClick={() => togglePlay(category, f)}
        className={`flex-shrink-0 p-0.5 rounded ${
          playingFile === f
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        title={playingFile === f ? 'Dừng' : 'Nghe'}
      >
        {playingFile === f ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button
        onClick={() => handleSelect(category, f)}
        disabled={loadingFile !== null}
        className="text-xs text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 truncate disabled:opacity-50"
      >
        {loadingFile === f ? '...' : f}
      </button>
      <a
        href={`/samples/${category}/${f}`}
        download={f}
        className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 flex-shrink-0"
        title="Tải về"
      >
        <DownloadIcon />
      </a>
    </div>
  )

  return (
    <div className="mt-3 border dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
          File mẫu ASVspoof5 (nghe, click tên để phân tích, hoặc tải về)
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
            {SAMPLES.bonafide.map(f => renderFile('bonafide', f))}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
            Spoof (giọng AI)
          </div>
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {SAMPLES.spoof.map(f => renderFile('spoof', f))}
          </div>
        </div>
      </div>
    </div>
  )
}
