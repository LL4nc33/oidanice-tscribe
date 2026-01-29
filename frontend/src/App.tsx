/**
 * Main application component.
 *
 * WHY: Single-page layout with URL input at top, selected job detail
 * in the middle, and job list at the bottom. This vertical flow
 * mirrors the Kindle reading experience - top-to-bottom, one focus
 * at a time. State management is kept in this root component because
 * the app is simple enough to not need a state library.
 */

import { useState, useCallback } from 'react'
import { Layout } from './components/Layout'
import { UrlInput } from './components/UrlInput'
import { JobStatusDisplay } from './components/JobStatus'
import { JobList } from './components/JobList'
import { TranscriptView } from './components/TranscriptView'
import { DownloadButtons } from './components/DownloadButtons'
import { useJobs, useJob } from './hooks/useJobs'
import { createJob, deleteJob } from './api/client'
import { JobStatus } from './types'
import type { CreateJobRequest } from './types'

export default function App() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const { jobs, error: listError, loading: listLoading, refetch: refetchJobs } = useJobs()
  const { job: selectedJob } = useJob(selectedJobId)

  /** WHY: After creating a job, auto-select it and refresh the list
   *  so the user immediately sees their new job's status. */
  const handleSubmit = useCallback(
    async (data: CreateJobRequest) => {
      const newJob = await createJob(data)
      setSelectedJobId(newJob.id)
      refetchJobs()
    },
    [refetchJobs]
  )

  /** WHY: Selecting a job from the list loads its full detail. */
  const handleSelectJob = useCallback((id: string) => {
    setSelectedJobId(id)
  }, [])

  /** WHY: Delete a single job via API then refresh the list. If the deleted
   *  job was selected, clear the selection to avoid stale detail view. */
  const handleDeleteJob = useCallback(
    async (id: string) => {
      await deleteJob(id)
      if (selectedJobId === id) setSelectedJobId(null)
      refetchJobs()
    },
    [selectedJobId, refetchJobs]
  )

  /** WHY: Clear all jobs by deleting each one sequentially. Sequential
   *  avoids overwhelming the backend with concurrent DELETEs. */
  const handleClearAll = useCallback(async () => {
    for (const job of jobs) {
      await deleteJob(job.id)
    }
    setSelectedJobId(null)
    refetchJobs()
  }, [jobs, refetchJobs])

  return (
    <Layout>
      {/* WHY: Inline error banner when API is unreachable. Auto-clears
       *  when polling succeeds because useJobs sets error back to null. */}
      {listError && (
        <div
          role="alert"
          className="font-serif text-sm leading-relaxed"
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text-secondary)',
          }}
        >
          Connection error — could not reach server.
        </div>
      )}

      <div className="space-y-6">
        {/* WHY: URL input always visible at the top for quick access. */}
        <section>
          <UrlInput onSubmit={handleSubmit} />
        </section>

        {/* WHY: Selected job wrapped in a card-like container with secondary
            background to visually separate active content from input/list. */}
        {selectedJob && (
          <section
            className="space-y-6 p-5"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <JobStatusDisplay job={selectedJob} />

            {/* WHY: Transcript only shown when job is done and has text. */}
            {selectedJob.status === JobStatus.DONE && selectedJob.result_text && (
              <>
                <TranscriptView text={selectedJob.result_text} />
                <DownloadButtons jobId={selectedJob.id} />
              </>
            )}
          </section>
        )}

        {/* WHY: Job list at the bottom acts as a history/navigation panel. */}
        <section>
          {listLoading ? (
            <p className="font-serif text-center py-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Loading...
            </p>
          ) : (
            <JobList
              jobs={jobs}
              selectedId={selectedJobId}
              onSelect={handleSelectJob}
              onDelete={handleDeleteJob}
              onClearAll={handleClearAll}
            />
          )}
        </section>
      </div>
    </Layout>
  )
}
