import type { ModelId } from '@/lib/types'

const MODEL_INFO: Record<ModelId, { label: string; desc: string }> = {
  molex:  { label: 'MoLEx',  desc: 'Model mới phát triển (ASVspoof5)' },
  aasist: { label: 'AASIST', desc: 'Baseline nổi tiếng (ASVspoof5)' },
}

interface Props {
  selected: ModelId[]
  onChange: (models: ModelId[]) => void
}

export default function ModelSelector({ selected, onChange }: Props) {
  const toggle = (id: ModelId) => {
    if (selected.includes(id)) {
      if (selected.length === 1) return
      onChange(selected.filter(m => m !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex gap-3 mb-4">
      {(Object.entries(MODEL_INFO) as [ModelId, typeof MODEL_INFO[ModelId]][]).map(([id, info]) => (
        <button
          key={id}
          onClick={() => toggle(id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
            selected.includes(id)
              ? id === 'molex'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
          }`}
        >
          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
            selected.includes(id) ? 'bg-current border-current' : 'border-gray-300 dark:border-gray-600'
          }`}>
            {selected.includes(id) && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none"/>
              </svg>
            )}
          </div>
          <div className="text-left">
            <div className="font-medium">{info.label}</div>
            <div className="text-xs opacity-70">{info.desc}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
