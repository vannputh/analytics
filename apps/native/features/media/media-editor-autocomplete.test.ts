import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  completeMediaEditorAutocompleteSelection,
  createInitialMediaEditorAutocompleteState,
  failMediaEditorAutocompleteSearch,
  resolveMediaEditorAutocompleteSelection,
  shouldSearchMediaEditorAutocomplete,
  startMediaEditorAutocompleteSearch,
  succeedMediaEditorAutocompleteSearch,
} from "@/features/media/media-editor-autocomplete"

describe("media editor autocomplete helpers", () => {
  it("only searches once the trimmed query reaches two characters", () => {
    assert.equal(shouldSearchMediaEditorAutocomplete("d"), false)
    assert.equal(shouldSearchMediaEditorAutocomplete(" dune "), true)
  })

  it("surfaces a failed search instead of silently keeping an empty state", () => {
    const state = failMediaEditorAutocompleteSearch("Failed to search")

    assert.deepEqual(state.results, [])
    assert.equal(state.loading, false)
    assert.equal(state.error, "Failed to search")
  })

  it("clears a previous error on retry and on successful results", () => {
    const loadingState = startMediaEditorAutocompleteSearch({
      ...createInitialMediaEditorAutocompleteState(),
      error: "Old error",
    })
    const successState = succeedMediaEditorAutocompleteSearch([
      {
        id: "tmdb_movie_1",
        media_type: "movie",
        poster_url: null,
        source: "tmdb",
        title: "Dune",
        year: "2021",
      },
    ])

    assert.equal(loadingState.error, null)
    assert.equal(loadingState.loading, true)
    assert.equal(successState.error, null)
    assert.equal(successState.loading, false)
    assert.deepEqual(successState.results.map((result) => result.title), ["Dune"])
  })

  it("resolves TMDB selections with the TMDB provider and metadata params", () => {
    const selection = resolveMediaEditorAutocompleteSelection({
      id: "tmdb_movie_137113",
      media_type: "movie",
      poster_url: null,
      source: "tmdb",
      title: "Edge of Tomorrow",
      year: "2014",
    })

    assert.equal(selection.source, "tmdb")
    assert.deepEqual(selection.params, {
      title: "Edge of Tomorrow",
      tmdb_id: "137113",
      type: "movie",
    })
  })

  it("resolves OMDb selections with the OMDb provider and IMDb id", () => {
    const selection = resolveMediaEditorAutocompleteSelection({
      id: "omdb_tt0078748",
      imdb_id: "tt0078748",
      media_type: "movie",
      poster_url: null,
      source: "omdb",
      title: "Alien",
      year: "1979",
    })

    assert.equal(selection.source, "omdb")
    assert.deepEqual(selection.params, {
      imdb_id: "tt0078748",
      title: "Alien",
      type: "movie",
    })
  })

  it("resets autocomplete state after a successful selection", () => {
    const nextState = completeMediaEditorAutocompleteSelection()

    assert.deepEqual(nextState, createInitialMediaEditorAutocompleteState())
  })
})
