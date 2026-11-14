const SHEET_ID = '1l0DrQD03Txx5XXkdMfrpUIr3j2UUx9a44xWi0LNXwXA'

// A cell value from the sheet; Google returns strings, numbers, booleans or null
export type CellValue = string | number | boolean | null

// Record<K, V> = an object whose keys are K and values are V
export type SheetRow = Record<string, CellValue>

// Shape of the gviz JSON we rely on (only the fields we actually read)
interface GvizResponse {
  table: {
    cols: { id: string; label: string }[]
    rows: { c: ({ v: CellValue } | null)[] }[]
  }
}

// Fetches a Google Sheet as an array of row objects keyed by header names.
// The sheet must be shared publicly ("Anyone with the link can view").
// Pass gid= for a specific sheet tab (default is the first tab, gid=0).
export async function fetchSheet(gid = 0): Promise<SheetRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}&headers=1`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch sheet: ${response.status}`)

  return parseSheetResponse(await response.text())
}

// Parses the gviz response text into an array of row objects keyed by header names.
export function parseSheetResponse(text: string): SheetRow[] {
  // Strip the JS wrapper Google wraps around the JSON response.
  // JSON.parse returns `any`; `as GvizResponse` tells TS what we expect it to be.
  // (It is not checked at runtime - it's a promise we make to the compiler.)
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as GvizResponse

  const cols = json.table.cols.map(col => col.label || col.id)
  return json.table.rows.map(row =>
    Object.fromEntries(cols.map((col, i) => [col, row.c[i]?.v ?? null]))
  )
}
