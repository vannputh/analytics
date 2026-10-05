import { createContext, useContext, useMemo, useState } from "react"

export type InsightsWorkspace = "media" | "food"

interface InsightsWorkspaceContextValue {
  setWorkspace(next: InsightsWorkspace): void
  workspace: InsightsWorkspace
}

const InsightsWorkspaceContext = createContext<InsightsWorkspaceContextValue | null>(null)

export function InsightsWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<InsightsWorkspace>("media")
  const value = useMemo(() => ({ setWorkspace, workspace }), [workspace])

  return (
    <InsightsWorkspaceContext.Provider value={value}>{children}</InsightsWorkspaceContext.Provider>
  )
}

export function useInsightsWorkspace() {
  const context = useContext(InsightsWorkspaceContext)

  if (!context) {
    throw new Error("useInsightsWorkspace must be used inside InsightsWorkspaceProvider.")
  }

  return context
}
