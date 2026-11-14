import { fetchSheet } from './googleSheets'

export interface ExampleGame {
  label: string
  fen: string
}

export const exampleGames = {
  games: [] as ExampleGame[],
  async init(): Promise<void> {
    const rows = await fetchSheet()
    // Sheet cells could be anything, so convert to strings and drop rows without a FEN
    this.games = rows
      .map(({ label, fen }) => ({ label: String(label ?? ''), fen: String(fen ?? '') }))
      .filter(game => game.fen !== '')
  },
}
