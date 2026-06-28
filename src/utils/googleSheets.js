const SHEET_ID = '1l0DrQD03Txx5XXkdMfrpUIr3j2UUx9a44xWi0LNXwXA'

// Fetches a Google Sheet as an array of row objects keyed by header names.
// The sheet must be shared publicly ("Anyone with the link can view").
// Pass gid= for a specific sheet tab (default is the first tab, gid=0).
export async function fetchSheet(gid = 0) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}&headers=1`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch sheet: ${response.status}`)

  const text = await response.text()

  // Strip the JS wrapper Google wraps around the JSON response
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))

  const cols = json.table.cols.map(col => col.label || col.id)
  return json.table.rows.map(row =>
    Object.fromEntries(cols.map((col, i) => [col, row.c[i]?.v ?? null]))
  )
}
