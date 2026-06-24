import type { SegmentResult, SingleModelResult } from '@/lib/types'

interface Props { result: SingleModelResult }

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
}

export default function SegmentTimeline({ result }: Props) {
  const { segments, totalDurationSec } = result
  if (!segments || segments.length === 0) return null

  const spoofCount = segments.filter(s => s.label === 'spoof').length
  const realCount = segments.length - spoofCount

  return (
    <div className="mt-3">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        Chi tiết {segments.length} đoạn ({formatTime(totalDurationSec)}):
        {spoofCount > 0 && <span className="text-red-500 ml-1">{spoofCount} AI</span>}
        {realCount > 0 && <span className="text-green-500 ml-1">{realCount} thật</span>}
      </div>

      <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        {segments.map((seg, i) => {
          const left = (seg.startSec / Math.max(totalDurationSec, 0.1)) * 100
          const width = ((seg.endSec - seg.startSec) / Math.max(totalDurationSec, 0.1)) * 100
          return (
            <div
              key={i}
              className={`absolute top-0 h-full ${
                seg.label === 'spoof' ? 'bg-red-300 dark:bg-red-700' : 'bg-green-300 dark:bg-green-700'
              }`}
              style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
              title={`${formatTime(seg.startSec)}–${formatTime(seg.endSec)}: ${
                seg.label === 'spoof' ? 'AI' : 'Thật'
              } (${(seg.confidence * 100).toFixed(0)}%)`}
            />
          )
        })}
      </div>

      <div className="flex justify-between mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
        <span>0s</span>
        <span>{formatTime(totalDurationSec)}</span>
      </div>

      <div className="mt-2 max-h-32 overflow-y-auto">
        <table className="w-full text-xs">
          <tbody>
            {segments.map((seg, i) => (
              <tr key={i} className="border-b border-gray-50 dark:border-gray-700">
                <td className="py-0.5 text-gray-400 dark:text-gray-500 tabular-nums">
                  {formatTime(seg.startSec)}–{formatTime(seg.endSec)}
                </td>
                <td className={`py-0.5 font-medium ${
                  seg.label === 'spoof' ? 'text-red-500' : 'text-green-500'
                }`}>
                  {seg.label === 'spoof' ? 'AI' : 'Thật'}
                </td>
                <td className="py-0.5 text-gray-400 text-right tabular-nums">
                  {(seg.confidence * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
