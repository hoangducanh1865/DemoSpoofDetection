import axios from 'axios'
import type { AnalysisJob, ModelId } from '@/lib/types'

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  timeout: 160_000,
})

export async function analyzeYouTube(
  url: string,
  models: ModelId[],
): Promise<AnalysisJob> {
  const { data } = await client.post<AnalysisJob>('/api/analyze/youtube', {
    url,
    models,
  })
  return data
}

export async function analyzeFile(
  file: File,
  useCase: string,
  models: ModelId[],
): Promise<AnalysisJob> {
  const form = new FormData()
  form.append('file', file)
  form.append('useCase', useCase)
  form.append('models', models.join(','))

  const { data } = await client.post<AnalysisJob>('/api/analyze/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
