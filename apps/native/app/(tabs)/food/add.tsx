import { useLocalSearchParams } from "expo-router"

import { FoodEditorScreen } from "@/features/food/food-editor-screen"

export default function FoodAddRoute() {
  const params = useLocalSearchParams<{ date?: string | string[]; templateId?: string | string[] }>()
  const date = Array.isArray(params.date) ? params.date[0] : params.date
  const templateId = Array.isArray(params.templateId) ? params.templateId[0] : params.templateId

  return <FoodEditorScreen mode="create" initialDate={date} templateEntryId={templateId} />
}
