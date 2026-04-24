"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { ArrowUp, Clapperboard, ChevronDown, ChevronUp, Code2, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { AIQueryResults } from "@/components/ai-query-results"
import { AIActionConfirmationDialog } from "@/components/ai-action-confirmation-dialog"
import { WorkspaceType } from "@/lib/ai-query-schemas"
import { validateActions, ValidatedAction } from "@/lib/ai-action-parser"
import { MediaAction } from "@/lib/ai-action-parser"
import { MediaEntry } from "@/lib/database.types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const MediaDetailsDialog = dynamic(
  () => import("@/components/media-details-dialog").then(m => m.MediaDetailsDialog),
  { ssr: false }
)

interface AIQueryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: WorkspaceType
}

interface QueryResult {
  sql: string
  explanation: string
  data: any[]
  metadata: {
    visualizationType: "kpi" | "table" | "bar" | "pie" | "line" | "area"
    columnCount: number
    rowCount: number
    columns: string[]
    columnTypes: Record<string, string>
  }
}

interface ActionResult {
  intent: string
  actions: MediaAction[]
}

interface Examples {
  ask: string[]
  do: string[]
}

const MEDIA_EXAMPLES: Examples = {
  ask: [
    "Movies watched in 2025",
    "Top rated this year",
    "What's still unwatched?",
  ],
  do: [
    "Add Dune Part 3 to my watchlist",
    "Mark Inception finished, rating 9/10",
    "Delete Morbius from my list",
  ],
}

const FOOD_EXAMPLES: Examples = {
  ask: [
    "How much did I spend in January?",
    "Top 5 highest rated restaurants",
  ],
  do: [
    "Add Blue Hill to my list",
    "Delete McDonald's from my list",
  ],
}

export function AIQueryDialog({ open, onOpenChange, workspace }: AIQueryDialogProps) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [actionResult, setActionResult] = useState<ActionResult | null>(null)
  const [validatedActions, setValidatedActions] = useState<ValidatedAction[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSQL, setShowSQL] = useState(false)
  const [editingAction, setEditingAction] = useState<{
    action: ValidatedAction
    index: number
  } | null>(null)
  const [showMediaDialog, setShowMediaDialog] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const examples = workspace === "media" ? MEDIA_EXAMPLES : FOOD_EXAMPLES
  const hasOutput = !!(result || error)

  useEffect(() => {
    if (!open || loading) return

    const focusTimer = window.setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)

    return () => window.clearTimeout(focusTimer)
  }, [open, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    if (!query.trim()) {
      toast.error("Please enter a question or request")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setActionResult(null)

    try {
      const response = await fetch("/api/ai-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), workspace }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to process query")
        toast.error(data.error || "Failed to process query")
        return
      }

      if (data.type === "action") {
        setActionResult({ intent: data.intent, actions: data.actions })
        const validated = await validateActions(data.actions)
        setValidatedActions(validated)
        setShowConfirmation(true)
        return
      }

      setResult({
        sql: data.sql,
        explanation: data.explanation,
        data: data.data,
        metadata: data.metadata,
      })

      if (data.metadata.rowCount === 0) {
        toast.info("No results found for this query")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (example: string) => {
    setQuery(example)
    setResult(null)
    setActionResult(null)
    setError(null)
    textareaRef.current?.focus()
  }

  const handleReset = () => {
    setQuery("")
    setResult(null)
    setActionResult(null)
    setError(null)
    setShowSQL(false)
    setShowConfirmation(false)
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) handleReset()
    onOpenChange(nextOpen)
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return
    e.preventDefault()
    if (loading || !query.trim()) return
    e.currentTarget.form?.requestSubmit()
  }

  const handleConfirmActions = async (selectedActions: ValidatedAction[]) => {
    try {
      const response = await fetch("/api/execute-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: selectedActions.map(va => va.action) }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast.error(`Failed to execute actions: ${data.error || "Unknown error"}`)
        return
      }

      const { summary } = data

      if (summary.succeeded > 0) {
        toast.success(`Done — ${summary.succeeded} action${summary.succeeded > 1 ? "s" : ""} executed`)
      }
      if (summary.failed > 0) {
        toast.error(`${summary.failed} action${summary.failed > 1 ? "s" : ""} failed`)
      }

      setShowConfirmation(false)
      handleReset()

      setTimeout(() => onOpenChange(false), 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      toast.error(errorMessage)
      throw err
    }
  }

  const handleEditAction = (action: ValidatedAction, index: number) => {
    setEditingAction({ action, index })
    setShowMediaDialog(true)
    setShowConfirmation(false)
  }

  const handleMediaDialogSuccess = (updatedEntry: MediaEntry) => {
    if (!editingAction) return

    const updatedActions = [...validatedActions]
    updatedActions[editingAction.index] = {
      ...updatedActions[editingAction.index],
      action: {
        ...updatedActions[editingAction.index].action,
        data: {
          title: updatedEntry.title,
          medium: updatedEntry.medium || undefined,
          type: updatedEntry.type || undefined,
          status: updatedEntry.status || undefined,
          genre: updatedEntry.genre || undefined,
          platform: updatedEntry.platform || undefined,
          my_rating: updatedEntry.my_rating || undefined,
          start_date: updatedEntry.start_date || undefined,
          finish_date: updatedEntry.finish_date || undefined,
          language: updatedEntry.language || undefined,
          episodes: updatedEntry.episodes || undefined,
          episodes_watched: updatedEntry.episodes_watched || undefined,
          price: updatedEntry.price || undefined,
          poster_url: updatedEntry.poster_url || undefined,
          imdb_id: updatedEntry.imdb_id || undefined,
          average_rating: updatedEntry.average_rating || undefined,
          season: updatedEntry.season || undefined,
          length: updatedEntry.length || undefined,
        },
      },
    }

    setValidatedActions(updatedActions)
    setShowMediaDialog(false)
    setShowConfirmation(true)
    setEditingAction(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-xl p-0 gap-0 flex flex-col max-h-[85vh] overflow-hidden">
          {/* Accessible title/description (visually hidden — custom header below) */}
          <DialogTitle className="sr-only">Director</DialogTitle>
          <DialogDescription className="sr-only">
            Your {workspace} agent — ask questions or give commands
          </DialogDescription>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b shrink-0">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-foreground text-background shrink-0">
              <Clapperboard className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold font-mono leading-none tracking-tight">Director</p>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5 leading-none">
                Your {workspace} agent
              </p>
            </div>
            {loading && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                thinking
              </div>
            )}
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4">

            {/* Suggestion chips — idle state */}
            {!hasOutput && !loading && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Ask</p>
                  <div className="flex flex-wrap gap-1.5">
                    {examples.ask.map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleExampleClick(ex)}
                        className="text-xs font-mono px-3 py-1.5 rounded-full border border-border hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Do</p>
                  <div className="flex flex-wrap gap-1.5">
                    {examples.do.map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleExampleClick(ex)}
                        className="text-xs font-mono px-3 py-1.5 rounded-full border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 transition-colors text-foreground/70 hover:text-foreground"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-[5px] shrink-0" />
                <p className="text-sm font-mono text-destructive leading-relaxed">{error}</p>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-3">
                {/* SQL collapsible — minimal */}
                <div className="rounded-lg border bg-muted/20 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowSQL(!showSQL)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Code2 className="h-3 w-3 shrink-0" />
                    <span>SQL</span>
                    <span className="ml-auto">
                      {showSQL
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />}
                    </span>
                  </button>
                  {showSQL && (
                    <pre className="border-t px-3 pb-3 pt-2 text-[11px] font-mono overflow-x-auto leading-relaxed text-muted-foreground">
                      {result.sql}
                    </pre>
                  )}
                </div>

                {result.data.length > 0 ? (
                  <AIQueryResults
                    data={result.data}
                    metadata={result.metadata}
                    explanation={result.explanation}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed px-6 py-10 text-center">
                    <p className="text-sm font-mono text-muted-foreground">No results found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input — pinned bottom */}
          <div className={cn("shrink-0 border-t px-4 py-3", hasOutput && "bg-muted/20")}>
            <form onSubmit={handleSubmit}>
              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder={loading ? "" : "Ask a question or give a command…"}
                  disabled={loading}
                  rows={1}
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-xl border-input bg-background px-3 py-2.5 text-sm font-mono focus-visible:ring-1 leading-snug"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={loading || !query.trim()}
                  className="h-10 w-10 rounded-xl shrink-0"
                >
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <ArrowUp className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-1.5 px-0.5">
                <p className="text-[10px] font-mono text-muted-foreground/50">
                  ↵ send · ⇧↵ newline
                </p>
                {hasOutput && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    new
                  </button>
                )}
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action confirmation */}
      {actionResult && (
        <AIActionConfirmationDialog
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          intent={actionResult.intent}
          validatedActions={validatedActions}
          onConfirm={handleConfirmActions}
          onEdit={handleEditAction}
        />
      )}

      {/* Edit action entry */}
      {editingAction && (
        <MediaDetailsDialog
          open={showMediaDialog}
          onOpenChange={(open) => {
            setShowMediaDialog(open)
            if (!open) {
              setShowConfirmation(true)
              setEditingAction(null)
            }
          }}
          entry={{
            id: "",
            title: editingAction.action.action.data?.title || "",
            medium: editingAction.action.action.data?.medium || null,
            type: editingAction.action.action.data?.type || null,
            status: editingAction.action.action.data?.status || null,
            genre: editingAction.action.action.data?.genre || null,
            platform: editingAction.action.action.data?.platform || null,
            my_rating: editingAction.action.action.data?.my_rating || null,
            start_date: editingAction.action.action.data?.start_date || null,
            finish_date: editingAction.action.action.data?.finish_date || null,
            language: editingAction.action.action.data?.language || null,
            episodes: editingAction.action.action.data?.episodes || null,
            episodes_watched: editingAction.action.action.data?.episodes_watched || null,
            price: editingAction.action.action.data?.price || null,
            poster_url: editingAction.action.action.data?.poster_url || null,
            imdb_id: editingAction.action.action.data?.imdb_id || null,
            average_rating: editingAction.action.action.data?.average_rating || null,
            season: editingAction.action.action.data?.season || null,
            length: editingAction.action.action.data?.length || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: "",
          } as MediaEntry}
          onSuccess={handleMediaDialogSuccess}
        />
      )}
    </>
  )
}
