import type { SegmentResult } from '@/lib/types'

interface Props { segments: SegmentResult[] }

export default function SegmentTimeline({ segments }: Props) {
  return (
    <div className="mt-2">
      <div className="text-xs text-gray-500 mb-1">Chi tiết theo đoạn:</div>
      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute inset-0 flex items-center">
          {segments.map((seg) => (
            <div
              key={seg.pct}
              className="absolute flex flex-col items-center"
              style={{ left: `${seg.pct}%`, transform: 'translateX(-50%)' }}
            >
              <div className={`w-3 h-3 rounded-full border-2 ${
                seg.label === 'spoof'
                  ? 'bg-red-400 border-red-600'
                  : 'bg-green-400 border-green-600'
              }`} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        {segments.map((seg) => (
          <div key={seg.pct} className="text-center">
            <div>{seg.pct}%</div>
            <div className={seg.label === 'spoof' ? 'text-red-500' : 'text-green-500'}>
              {seg.label === 'spoof' ? 'AI' : 'Thật'}
              {' '}{(seg.confidence * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
