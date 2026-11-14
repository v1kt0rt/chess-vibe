import { fetchSheet } from './googleSheets'

export const exampleGames = {
  games: [],
  async init() {
    const rows = await fetchSheet()
    this.games = rows.map(({ label, fen }) => ({ label, fen }))
  },
}
