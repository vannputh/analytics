import { useLocalSearchParams } from "expo-router"

import { MediaEditorScreen } from "@/features/media/media-editor-screen"
import { useMediaDiary } from "@/features/media/media-diary-provider"

export default function MediaEditRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { getEntryById } = useMediaDiary()

  return <MediaEditorScreen mode="edit" entry={id ? getEntryById(id) : null} />
}
