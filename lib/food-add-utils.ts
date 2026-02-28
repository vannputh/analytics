import { format } from "date-fns/format";
import { isValid } from "date-fns/isValid";

export type FoodSavePhase =
  | "idle"
  | "saving-entry"
  | "uploading-place"
  | "uploading-items"
  | "finalizing";

export interface FoodSaveProgress {
  phase: FoodSavePhase;
  placeUploaded: number;
  placeTotal: number;
  itemUploaded: number;
  itemTotal: number;
}

export interface FoodImageDraft {
  preview: string;
  is_primary: boolean;
  file?: File;
}

export interface FoodSnapshotItem {
  name: string;
  price: number | null;
  categories: string[];
  imageIdentity: string | null;
}

export interface FoodSnapshotInput {
  name: string;
  branch: string;
  visitDate: Date | undefined;
  category: string;
  address: string;
  googleMapsUrl: string;
  neighborhood: string;
  city: string;
  country: string;
  instagramHandle: string;
  websiteUrl: string;
  cuisineTypes: string[];
  tags: string[];
  items: FoodSnapshotItem[];
  favoriteItem: string;
  overallRating: number | null;
  foodRating: number | null;
  ambianceRating: number | null;
  serviceRating: number | null;
  valueRating: number | null;
  totalPrice: string;
  priceLevel: string;
  diningType: string;
  wouldReturn: boolean | null;
  notes: string;
  placeImages: FoodImageDraft[];
}

export function parseLocalDateInput(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yearString, monthString, dayString] = trimmed.split("-");
    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);
    const date = new Date(year, month - 1, day);
    return isValid(date) ? date : undefined;
  }

  const parsed = new Date(trimmed);
  return isValid(parsed) ? parsed : undefined;
}

export function formatLocalDateOnly(value: Date | undefined): string {
  if (!value || !isValid(value)) return "";
  return format(value, "yyyy-MM-dd");
}

export function normalizePlaceImages(images: FoodImageDraft[]): FoodImageDraft[] {
  const deduped: FoodImageDraft[] = [];
  const seen = new Set<string>();

  for (const image of images) {
    const key = image.preview.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push({ ...image });
  }

  const primaryIndices: number[] = [];
  deduped.forEach((img, idx) => {
    if (img.is_primary) primaryIndices.push(idx);
  });

  if (primaryIndices.length === 0 && deduped.length > 0) {
    deduped[0] = { ...deduped[0], is_primary: true };
  } else if (primaryIndices.length > 1) {
    const firstPrimary = primaryIndices[0];
    deduped.forEach((img, idx) => {
      deduped[idx] = { ...img, is_primary: idx === firstPrimary };
    });
  }

  return deduped;
}

function buildFileIdentity(file: File | undefined): string | null {
  if (!file) return null;
  return `file:${file.name}:${file.size}:${file.lastModified}`;
}

function buildImageIdentity(preview: string, file?: File): string {
  const fileIdentity = buildFileIdentity(file);
  if (fileIdentity) return fileIdentity;
  return `url:${preview}`;
}

export function createFoodFormSnapshot(input: FoodSnapshotInput): string {
  const normalized = {
    name: input.name.trim(),
    branch: input.branch.trim(),
    visitDate: formatLocalDateOnly(input.visitDate),
    category: input.category.trim(),
    address: input.address.trim(),
    googleMapsUrl: input.googleMapsUrl.trim(),
    neighborhood: input.neighborhood.trim(),
    city: input.city.trim(),
    country: input.country.trim(),
    instagramHandle: input.instagramHandle.trim(),
    websiteUrl: input.websiteUrl.trim(),
    cuisineTypes: [...input.cuisineTypes].map((value) => value.trim()).filter(Boolean).sort(),
    tags: [...input.tags].map((value) => value.trim()).filter(Boolean).sort(),
    items: input.items.map((item) => ({
      name: item.name.trim(),
      price: item.price,
      categories: [...item.categories].map((value) => value.trim()).filter(Boolean).sort(),
      imageIdentity: item.imageIdentity,
    })),
    favoriteItem: input.favoriteItem.trim(),
    overallRating: input.overallRating,
    foodRating: input.foodRating,
    ambianceRating: input.ambianceRating,
    serviceRating: input.serviceRating,
    valueRating: input.valueRating,
    totalPrice: input.totalPrice.trim(),
    priceLevel: input.priceLevel.trim(),
    diningType: input.diningType.trim(),
    wouldReturn: input.wouldReturn,
    notes: input.notes.trim(),
    placeImages: input.placeImages.map((image) => ({
      identity: buildImageIdentity(image.preview, image.file),
      is_primary: image.is_primary,
    })),
  };

  return JSON.stringify(normalized);
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];

  const boundedConcurrency = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array<R>(items.length);
  let currentIndex = 0;

  const runWorker = async () => {
    while (currentIndex < items.length) {
      const itemIndex = currentIndex;
      currentIndex += 1;
      results[itemIndex] = await worker(items[itemIndex], itemIndex);
    }
  };

  const workers = Array.from({ length: boundedConcurrency }, () => runWorker());
  await Promise.all(workers);
  return results;
}

export function getFoodSaveProgressLabel(progress: FoodSaveProgress): string {
  switch (progress.phase) {
    case "saving-entry":
      return "Saving entry...";
    case "uploading-place":
      return `Uploading place photos ${progress.placeUploaded}/${progress.placeTotal}`;
    case "uploading-items":
      return `Uploading item photos ${progress.itemUploaded}/${progress.itemTotal}`;
    case "finalizing":
      return "Finalizing...";
    default:
      return "";
  }
}
