import { useEffect, useState } from 'react'
import { Palette, X } from 'lucide-react'
import ColorPicker from './globalColorPicker'
import ColorInspector, { resetElementEdits } from './colorInspector'

const TOKENS = [
  'background', 'sidebar', 'surface', 'primary', 'on-primary',
  'secondary', 'on-secondary' , 'accent', 'text', 'on-background',
] as const
type Token = (typeof TOKENS)[number]
type Colors = Record<Token, string>

const THEMES = ['classic', 'ocean', 'forest', 'grape']
const root = document.documentElement

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

  const copy = async () => {
    const css = `@theme {\n${TOKENS.map((t) => `  --color-${t}: ${colors[t]};`).join('\n')}\n}`
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
                className={`rounded-lg border-2 px-3 py-1.5 text-sm capitalize ${
                  theme === t ? 'border-slate-900 bg-slate-100' : 'border-slate-200 hover:border-slate-400'
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