import { useLocalSearchParams } from "expo-router"

import { MediaDetailScreen } from "@/features/media/media-detail-screen"

export default function MediaDetailRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  return <MediaDetailScreen entryId={id ?? ""} />
}
