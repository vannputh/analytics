import { getMediaDiaryAreaPresentation } from "@/features/media/media-diary-state"
import { MEDIA_DIARY_AREAS, type MediaDiaryArea } from "@/features/media/media-types"

export interface MediaDiaryAreaSwitcherSegment {
  area: MediaDiaryArea
  icon: string
  label: string
  onPress(): void
  selected: boolean
}

export const MEDIA_DIARY_AREA_SWITCHER_SELECTED_BACKGROUND = "#111111"
export const MEDIA_DIARY_AREA_SWITCHER_SELECTED_TEXT = "#FFFFFF"
export const MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_BACKGROUND = "rgba(255, 255, 255, 0.9)"
export const MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_BORDER = "rgba(17, 17, 17, 0.04)"
export const MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_TEXT = "#111111"
export const MEDIA_DIARY_AREA_SWITCHER_PRESSED_OVERLAY = "rgba(17, 17, 17, 0.06)"

export function createMediaDiaryAreaSwitcherSegments(
  activeArea: MediaDiaryArea,
  onChange: (nextArea: MediaDiaryArea) => void,
): MediaDiaryAreaSwitcherSegment[] {
  return MEDIA_DIARY_AREAS.map((area) => {
    const presentation = getMediaDiaryAreaPresentation(area)

    return {
      area,
      icon: presentation.icon,
      label: presentation.segmentLabel,
      onPress: () => onChange(area),
      selected: area === activeArea,
    }
  })
}
