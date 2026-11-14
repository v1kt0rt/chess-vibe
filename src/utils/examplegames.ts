import { reactive } from 'vue'
import { fetchSheet } from './googleSheets'

export interface ExampleGame {
  label: string
  fen: string
}

let loadPromise: Promise<void> | null = null

// reactive() makes Vue re-render any component that reads these fields when
// they change, e.g. when the list arrives from Google Sheets.
export const exampleGames = reactive({
  games: [] as ExampleGame[],
  loading: false,
  error: null as string | null,

  // Safe to call from several pages: the sheet is only fetched once
  // (a failed load is retried on the next call).
  init(): Promise<void> {
    loadPromise ??= this.load()
    return loadPromise
  },

  async load(): Promise<void> {
    this.loading = true
    this.error = null
    try {
      const rows = await fetchSheet()
      // Sheet cells could be anything, so convert to strings and drop rows without a FEN
      this.games = rows
        .map(({ label, fen }) => ({ label: String(label ?? ''), fen: String(fen ?? '') }))
        .filter(game => game.fen !== '')
    } catch (e) {
      console.error('Failed to load example games:', e)
      this.error = 'Could not load example games.'
      loadPromise = null
    } finally {
      this.loading = false
    }
  },
})

// The game picked on the start page, waiting to be loaded by the chessboard page.
// Kept in memory only, so the URL stays clean (it is lost on a page refresh).
let pendingGame: ExampleGame | null = null

export function selectGame(game: ExampleGame): void {
  pendingGame = game
}

// Returns the picked game once, then clears it so it isn't loaded again
// the next time the chessboard page opens.
export function takeSelectedGame(): ExampleGame | null {
  const game = pendingGame
  pendingGame = null
  return game
}
