"use client"

import { useState } from "react"
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AIQueryResults } from "@/components/ai-query-results"
import { WorkspaceType } from "@/lib/ai-query-schemas"
import { toast } from "sonner"

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

const MEDIA_EXAMPLES = [
  "How many movies did I watch in 2025?",
  "What did I watch last week?",
  "Average rating by genre",
  "Total spent on games",
  "Show me all movies rated above 8",
]

const FOOD_EXAMPLES = [
  "How much did I spend on food in January?",
  "Top 5 highest rated restaurants",
  "What cuisine do I eat most?",
  "Restaurants I would return to",
  "Average price per meal",
]

export function AIQueryDialog({ open, onOpenChange, workspace }: AIQueryDialogProps) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSQL, setShowSQL] = useState(false)

  const examples = workspace === "media" ? MEDIA_EXAMPLES : FOOD_EXAMPLES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) {
      toast.error("Please enter a question")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/ai-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          workspace,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to process query")
        toast.error(data.error || "Failed to process query")
        return
      }

      setResult({
        sql: data.sql,
        explanation: data.explanation,
        data: data.data,
        metadata: data.metadata,
      })

      // Show success message based on result count
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
    setError(null)
  }

  const handleReset = () => {
    setQuery("")
    setResult(null)
    setError(null)
    setShowSQL(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            <Sparkles className="h-5 w-5" />
            AI Data Analysis
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Ask questions about your {workspace} data in plain English
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Query Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="query" className="text-sm font-mono">
                Your Question
              </Label>
              <Textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`e.g., "${examples[0]}"`}
                className="min-h-[100px] font-mono text-sm"
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading || !query.trim()} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>

              {(result || error) && (
                <Button type="button" variant="outline" onClick={handleReset}>
                  Ask Another Question
                </Button>
              )}
            </div>
          </form>

          {/* Example Queries */}
          {!result && !error && !loading && (
            <div className="space-y-2">
              <Label className="text-xs font-mono text-muted-foreground">
                Try these examples:
              </Label>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(example)}
                    className="text-xs font-mono"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm font-mono text-destructive">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4">
              {/* SQL Query (Collapsible) */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <button
                  type="button"
                  onClick={() => setShowSQL(!showSQL)}
                  className="flex w-full items-center justify-between text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Generated SQL Query</span>
                  {showSQL ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {showSQL && (
                  <pre className="mt-2 overflow-x-auto rounded bg-background p-3 text-xs font-mono">
                    {result.sql}
                  </pre>
                )}
              </div>

              {/* Results Visualization */}
              {result.data.length > 0 ? (
                <AIQueryResults
                  data={result.data}
                  metadata={result.metadata}
                  explanation={result.explanation}
                />
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm font-mono text-muted-foreground">
                    No results found for this query
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
