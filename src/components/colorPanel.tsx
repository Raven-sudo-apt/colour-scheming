import { useEffect, useState } from 'react'
import { Palette, X, ClipboardPaste, Trash2 } from 'lucide-react'
import ColorPicker from './globalColorPicker'
import ColorInspector, { resetElementEdits } from './colorInspector'

const TOKENS = [
  'background', 'sidebar', 'surface', 'primary', 'on-primary',
  'secondary', 'on-secondary', 'accent', 'text', 'on-background',
] as const
type Token = (typeof TOKENS)[number]
type Colors = Record<Token, string>

const THEMES = ['classic', 'ocean', 'forest', 'grape']
const STORAGE_KEY = 'color-scheme:custom'
const root = document.documentElement

function parseThemeCss(css: string): Partial<Colors> {
  const out: Partial<Colors> = {}
  for (const t of TOKENS) {
    const m = css.match(new RegExp(`--color-${t}\\s*:\\s*(#[0-9a-fA-F]{3,8})`))
    if (m) out[t] = m[1]
  }
  return out
}

const readColors = (): Colors => {
  const s = getComputedStyle(root)
  return Object.fromEntries(
    TOKENS.map((t) => [t, s.getPropertyValue(`--color-${t}`).trim() || '#000000']),
  ) as Colors
}


export default function ColorPanel() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState('classic')
  const [colors, setColors] = useState<Colors>(() => readColors())
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(true)
  const [status, setStatus] = useState<string | null>(null)

  const flash = (msg: string) => {
    setStatus(msg)
    setTimeout(() => setStatus(null), 2000)
  }

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw) as Partial<Colors>
      Object.entries(saved).forEach(([k, v]) => root.style.setProperty(`--color-${k}`, v as string))
      setColors((c) => ({ ...c, ...saved }))
      setTheme('custom')
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => setColors(readColors()), [theme])

  const pickTheme = (t: string) => {
    TOKENS.forEach((k) => root.style.removeProperty(`--color-${k}`))
    root.dataset.theme = t
    setTheme(t)
  }

  const change = (token: Token, value: string) => {
    root.style.setProperty(`--color-${token}`, value)
    setColors((c) => ({ ...c, [token]: value }))
  }

  const importCss = async () => {
    let text: string
    try {
      text = await navigator.clipboard.readText()
    } catch {
      flash('Could not read clipboard — check browser permissions')
      return
    }
    const parsed = parseThemeCss(text)
    const found = Object.keys(parsed) as Token[]
    if (!found.length) {
      flash('No --color-* values found in clipboard')
      return
    }
    found.forEach((k) => root.style.setProperty(`--color-${k}`, parsed[k]!))
    const next = { ...colors, ...parsed }
    setColors(next)
    setTheme('custom')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    flash(`Imported ${found.length} color${found.length > 1 ? 's' : ''} and saved it`)
  }

  const deleteSaved = () => {
    localStorage.removeItem(STORAGE_KEY)
    pickTheme('classic')
    flash('Saved colors deleted')
  }

  const copy = async () => {
    const css = `\n${TOKENS.map((t) => `  --color-${t}: ${colors[t]};`).join('\n')}\n`
    await navigator.clipboard.writeText(css)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div data-color-ui className="fixed right-4 bottom-4 z-50 font-sans">
      {open && (
        <div className="mb-3 max-h-[80vh] w-72 overflow-y-auto rounded-2xl bg-white p-4 text-slate-900 shadow-2xl ring-1 ring-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Color scheme</h2>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          <label className="mb-4 flex cursor-pointer items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm">
            Click an element to recolor it
            <input type="checkbox" checked={editing} onChange={(e) => setEditing(e.target.checked)} className="size-4 accent-slate-900" />
          </label>

          <div className="mb-4 grid grid-cols-2 gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => pickTheme(t)}
                className={`rounded-lg border-2 px-3 py-1.5 text-sm capitalize ${theme === t ? 'border-slate-900 bg-slate-100' : 'border-slate-200 hover:border-slate-400'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          <ul className="space-y-2">
            {TOKENS.map((t) => (
              <li key={t} className="flex items-center justify-between gap-2 text-sm">
                <span>{t}</span>
                <span className="flex items-center gap-2">
                  <code className="text-xs text-slate-500">{colors[t]}</code>
                  <ColorPicker
                    label={t}
                    value={colors[t]}
                    onChange={(v) => change(t, v)}
                    swatches={[...new Set(Object.values(colors))]}
                  />
                </span>
              </li>
            ))}
          </ul>

          <button onClick={copy} className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            {copied ? 'Copied' : 'Copy CSS'}
          </button>
          <button onClick={resetElementEdits} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
            Reset single-element edits
          </button>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <button
              onClick={importCss}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            >
              <ClipboardPaste size={15} /> Import copied CSS
            </button>
            <button
              onClick={deleteSaved}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={15} /> Delete saved colors
            </button>
            {status && <p className="mt-2 text-center text-xs text-slate-500">{status}</p>}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="ml-auto flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xl font-medium text-slate-900 shadow-xl ring-1 ring-slate-200 hover:bg-slate-50"
      >
        <Palette size={22} /> Colors
      </button>

      <ColorInspector enabled={editing} swatches={[...new Set(Object.values(colors))]} />
    </div>
  )
}