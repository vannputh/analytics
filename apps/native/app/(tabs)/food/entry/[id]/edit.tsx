import { useLocalSearchParams } from "expo-router"

import { FoodEditorScreen } from "@/features/food/food-editor-screen"

export default function FoodEditRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  return <FoodEditorScreen mode="edit" entryId={id ?? ""} />
}
