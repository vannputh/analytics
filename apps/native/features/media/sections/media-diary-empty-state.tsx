import { MediaEmptyState } from "@/features/media/primitives/media-empty-state"

export function MediaDiaryEmptyState({
  error,
  loading,
}: {
  error: string | null
  loading: boolean
}) {
  return (
    <MediaEmptyState
      body={error ? error : "Your native media diary will appear here once entries exist in Supabase."}
      loading={loading}
      title={loading ? "Loading media diary" : error ? "Unable to load media diary" : "No media entries yet"}
    />
  )
}
