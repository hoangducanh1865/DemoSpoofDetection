import type { AnalysisJob, SingleModelResult } from '@/lib/types'
import SegmentTimeline from './SegmentTimeline'

interface Props {
  job: AnalysisJob
}

function ResultPanel({
  title,
  result,
  primary,
}: {
  title: string
  result?: SingleModelResult
  primary?: boolean
}) {
  if (!result) return null

  const isSpoof = result.label === 'spoof'

  return (
    <div
      className={`flex-1 rounded-xl border p-4 ${
        primary ? 'ring-2 ring-blue-500 border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="font-semibold text-sm">{title}</span>
        {primary && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
            Primary
          </span>
        )}
      </div>

      <div
        className={`text-2xl font-bold mb-2 ${
          isSpoof ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        }`}
      >
        {isSpoof ? 'Giọng AI' : 'Giọng thật'}
      </div>

      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
        <div>
          Xác suất spoof:{' '}
          <span className="font-medium">
            {(result.spoofProbability * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          Độ tin cậy:{' '}
          <span className="font-medium">
            {(result.confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          {result.segmentsAnalyzed !== undefined && (
            <span>{result.segmentsAnalyzed} đoạn · </span>
          )}
          {result.processingMs !== undefined && (
            <span>Xử lý: {(result.processingMs / 1000).toFixed(1)}s</span>
          )}
        </div>
      </div>

      {result.segments && result.segments.length > 0 && (
        <SegmentTimeline result={result} />
      )}
    </div>
  )
}

export default function DualResultCard({ job }: Props) {
  const hasBoth = !!job.resultMolex && !!job.resultAasist

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Kết quả phân tích</h2>
        {job.totalProcessingMs !== undefined && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Tổng: {(job.totalProcessingMs / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      <div className={`flex gap-4 ${hasBoth ? '' : 'justify-center'}`}>
        <ResultPanel title="MoLEx" result={job.resultMolex} primary />
        <ResultPanel title="AASIST" result={job.resultAasist} />
      </div>

      {job.inputReference && (
        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 truncate">
          Nguồn: {job.inputReference}
        </div>
      )}
    </div>
  )
}
