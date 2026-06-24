export type ModelId = 'molex' | 'aasist'

export interface SegmentResult {
  pct: number
  label: 'real' | 'spoof'
  confidence: number
}

export interface SingleModelResult {
  label: 'real' | 'spoof'
  confidence: number
  spoofProbability: number
  segments: SegmentResult[]
  segmentsAnalyzed?: number
  totalDurationSec: number
  processingMs?: number
}

export interface AnalysisJob {
  id: string
  createdAt: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  useCase: string
  inputReference: string
  resultMolex?: SingleModelResult
  resultAasist?: SingleModelResult
  errorMessage?: string
  totalProcessingMs?: number
}
