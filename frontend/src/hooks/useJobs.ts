/**
 * Custom hooks for job data fetching with polling.
 *
 * WHY: Polling over WebSockets because it is simpler infrastructure,
 * has automatic recovery on disconnect, and works behind any reverse proxy
 * without special configuration. The trade-off of slightly higher latency
 * is acceptable for transcription jobs that take minutes anyway.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { listJobs, getJob } from '../api/client'
import type { Job, JobListItem } from '../types'
import { JobStatus } from '../types'

/** WHY: Polls the job list every 5 seconds while any job is active.
 *  Stops polling when all jobs are terminal (done/failed) to avoid
 *  unnecessary network requests. Polling resumes on manual refetch
 *  (e.g. after creating a new job). */
export function useJobs() {
  const [jobs, setJobs] = useState<JobListItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  /** WHY: Tracks whether polling should be active. Starts true for
   *  initial load, set to true on manual refetch, set to false when
   *  all jobs are terminal. */
  const [polling, setPolling] = useState(true)

  const fetchJobs = useCallback(async () => {
    try {
      const data = await listJobs()
      setJobs(data)
      setError(null)

      // WHY: Stop polling when no jobs need updates.
      const hasActive = data.some((j) => isActiveStatus(j.status))
      if (!hasActive) setPolling(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
    if (!polling) return

    const interval = setInterval(fetchJobs, 5000)
    return () => clearInterval(interval)
  }, [fetchJobs, polling])

  /** WHY: Manual refetch re-enables polling so newly created jobs
   *  get status updates. Called from App after createJob(). */
  const refetch = useCallback(() => {
    setPolling(true)
    fetchJobs()
  }, [fetchJobs])

  return { jobs, error, loading, refetch }
}

/** WHY: Helper to determine if a job is still in-progress and needs polling. */
function isActiveStatus(status: JobStatus): boolean {
  return (
    status === JobStatus.QUEUED ||
    status === JobStatus.DOWNLOADING ||
    status === JobStatus.TRANSCRIBING
  )
}

/** WHY: Polls a single job every 2 seconds while it is active (queued,
 *  downloading, or transcribing). Stops polling once done or failed
 *  to avoid unnecessary network requests. 2s gives good progress UX. */
export function useJob(id: string | null) {
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /** WHY: Ref keeps the latest status accessible inside the interval callback
   *  without re-creating the interval on every status change. */
  const statusRef = useRef<JobStatus | null>(null)
  statusRef.current = job?.status ?? null

  const fetchJob = useCallback(async () => {
    if (!id) return
    try {
      const data = await getJob(id)
      setJob(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) {
      setJob(null)
      setError(null)
      return
    }

    setLoading(true)
    fetchJob()

    const interval = setInterval(() => {
      // WHY: Only poll while job is active. Once done/failed, clear interval.
      if (statusRef.current && !isActiveStatus(statusRef.current)) {
        clearInterval(interval)
        return
      }
      fetchJob()
    }, 2000)

    return () => clearInterval(interval)
  }, [id, fetchJob])

  return { job, error, loading, refetch: fetchJob }
}
