// Legacy export for backward compatibility.
// Use createClient from @/lib/supabase/client in new code.
// Delegates to the memoized client so the whole app shares one browser instance.
import { createClient } from "./supabase/client"

export const supabase = createClient()
