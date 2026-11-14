import { describe, it, expect, beforeEach, vi } from 'vitest'

// Replace the network call with a mock we control in each test
vi.mock('./googleSheets', () => ({ fetchSheet: vi.fn() }))

describe('exampleGames', () => {
  let exampleGames: typeof import('./examplegames').exampleGames
  let fetchSheet: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.resetModules() // fresh module state (and load-once promise) per test
    exampleGames = (await import('./examplegames')).exampleGames
    fetchSheet = vi.mocked((await import('./googleSheets')).fetchSheet)
    fetchSheet.mockReset()
  })

  it('loads games and drops rows without a FEN', async () => {
    fetchSheet.mockResolvedValue([
      { label: 'Opera Game', fen: '8/8/8/8/8/8/8/8 w - - 0 1' },
      { label: 'Empty', fen: null },
    ])

    await exampleGames.init()

    expect(exampleGames.games).toEqual([{ label: 'Opera Game', fen: '8/8/8/8/8/8/8/8 w - - 0 1' }])
    expect(exampleGames.loading).toBe(false)
    expect(exampleGames.error).toBeNull()
  })

  it('fetches the sheet only once when initialized repeatedly', async () => {
    fetchSheet.mockResolvedValue([])

    await Promise.all([exampleGames.init(), exampleGames.init()])
    await exampleGames.init()

    expect(fetchSheet).toHaveBeenCalledTimes(1)
  })

  it('reports an error and retries on the next call', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchSheet.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([])

    await exampleGames.init()
    expect(exampleGames.error).toBe('Could not load example games.')

    await exampleGames.init()
    expect(exampleGames.error).toBeNull()
    expect(fetchSheet).toHaveBeenCalledTimes(2)
  })
})

describe('selected game', () => {
  it('hands the selected game over exactly once', async () => {
    vi.resetModules()
    const { selectGame, takeSelectedGame } = await import('./examplegames')
    const game = { label: 'Opera Game', fen: '8/8/8/8/8/8/8/8 w - - 0 1' }

    expect(takeSelectedGame()).toBeNull()
    selectGame(game)
    expect(takeSelectedGame()).toEqual(game)
    expect(takeSelectedGame()).toBeNull()
  })
})
