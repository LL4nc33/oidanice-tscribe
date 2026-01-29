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
import { createJob } from './api/client'
import { JobStatus } from './types'
import type { CreateJobRequest } from './types'

export default function App() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const { jobs, loading: listLoading, refetch: refetchJobs } = useJobs()
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

  return (
    <Layout>
      <div className="space-y-8">
        {/* WHY: URL input always visible at the top for quick access. */}
        <section>
          <UrlInput onSubmit={handleSubmit} />
        </section>

        {/* WHY: Horizontal rule between sections mimics Kindle page dividers. */}
        {selectedJob && (
          <>
            <hr style={{ borderColor: 'var(--border)', borderStyle: 'solid' }} />

            <section className="space-y-6">
              <JobStatusDisplay job={selectedJob} />

              {/* WHY: Transcript only shown when job is done and has text. */}
              {selectedJob.status === JobStatus.DONE && selectedJob.result_text && (
                <>
                  <TranscriptView text={selectedJob.result_text} />
                  <DownloadButtons jobId={selectedJob.id} />
                </>
              )}
            </section>
          </>
        )}

        <hr style={{ borderColor: 'var(--border)', borderStyle: 'solid' }} />

        {/* WHY: Job list at the bottom acts as a history/navigation panel. */}
        <section>
          {listLoading ? (
            <p className="font-serif text-center py-8" style={{ color: 'var(--text-secondary)' }}>
              Loading...
            </p>
          ) : (
            <JobList
              jobs={jobs}
              selectedId={selectedJobId}
              onSelect={handleSelectJob}
            />
          )}
        </section>
      </div>
    </Layout>
  )
}
