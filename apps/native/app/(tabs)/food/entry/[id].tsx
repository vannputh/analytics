import { useLocalSearchParams } from "expo-router"

import { FoodDetailScreen } from "@/features/food/food-detail-screen"

export default function FoodDetailRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  return <FoodDetailScreen entryId={id ?? ""} />
}
