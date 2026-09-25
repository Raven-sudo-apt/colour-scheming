import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import ColorPicker from './globalColorPicker'

type Styled = HTMLElement | SVGElement
type Prop = 'background-color' | 'color' | 'border-color'
type Cand = { el: Styled; prop: Prop; label: string }
type Session = { x: number; y: number; cands: Cand[]; values: string[]; originals: string[]; index: number }

const ATTR = 'data-color-edited' // lists the properties overridden on an element
const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })

function parseColor(css: string) {
  const m = css.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+)(%?))?\s*\)$/)
  let rgba: number[]
  if (m) {
    rgba = [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : m[5] ? +m[4] / 100 : +m[4]]
  } else if (ctx) {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000' // reset so an unparseable value can't reuse the last color
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    rgba = [d[0], d[1], d[2], d[3] / 255]
  } else {
    rgba = [0, 0, 0, 0]
  }
  const hex = '#' + rgba.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')
  return { hex, alpha: rgba[3] }
}

const read = (c: Cand) =>
  parseColor(getComputedStyle(c.el).getPropertyValue(c.prop === 'border-color' ? 'border-top-color' : c.prop)).hex

const mark = (el: Element, prop: string) => {
  const set = new Set((el.getAttribute(ATTR) ?? '').split(',').filter(Boolean))
  el.setAttribute(ATTR, [...set.add(prop)].join(','))
}
const unmark = (el: Element, prop: string) => {
  const set = new Set((el.getAttribute(ATTR) ?? '').split(',').filter(Boolean))
  set.delete(prop)
  if (set.size) el.setAttribute(ATTR, [...set].join(','))
  else el.removeAttribute(ATTR)
}

export function resetElementEdits() {
  document.querySelectorAll<Styled>(`[${ATTR}]`).forEach((el) => {
    ;(el.getAttribute(ATTR) ?? '').split(',').filter(Boolean).forEach((p) => el.style.setProperty(p, ''))
    el.removeAttribute(ATTR)
  })
}

function inspect(target: Element): Cand[] {
  const el = (target.closest('svg') ?? target) as Styled // icons are edited as a whole
  const icon = el instanceof SVGElement

  const text: Cand = { el, prop: 'color', label: icon ? 'Icon' : 'Text' }

  let bg: Cand | null = null
  for (let p: Element | null = el; p; p = p.parentElement) {
    if (parseColor(getComputedStyle(p).backgroundColor).alpha > 0) {
      bg = { el: p as Styled, prop: 'background-color', label: p === el ? 'Background' : 'Parent background' }
      break
    }
  }

  const cs = getComputedStyle(el)
  const border: Cand | null =
    parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' && parseColor(cs.borderTopColor).alpha > 0
      ? { el, prop: 'border-color', label: 'Border' }
      : null

  const onText = !icon && Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
  const list = onText || icon ? [text, bg, border] : [bg, text, border]
  return list.filter((c): c is Cand => c !== null)
}

export default function ColorInspector({ enabled, swatches = [] }: { enabled: boolean; swatches?: string[] }) {
  const [session, setSession] = useState<Session | null>(null)
  const [hover, setHover] = useState<DOMRect | null>(null)
  const [, redraw] = useState(0)
  const isOpen = session !== null

  useEffect(() => {
    if (!enabled) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element
      if (t.closest('[data-color-ui]')) return
      e.preventDefault()
      e.stopPropagation()
      if (isOpen) return 
      const cands = inspect(t)
      setSession({
        x: e.clientX,
        y: e.clientY,
        cands,
        values: cands.map(read),
        originals: cands.map((c) => c.el.style.getPropertyValue(c.prop)),
        index: 0,
      })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [enabled, isOpen])

  useEffect(() => {
    if (!enabled) setSession(null)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    let last: Element | null = null
    const move = (e: PointerEvent) => {
      const t = e.target as Element
      if (t === last) return
      last = t
      setHover(t.closest('[data-color-ui]') ? null : t.getBoundingClientRect())
    }
    const onScroll = () => {
      last = null
      setHover(null)
      redraw((n) => n + 1)
    }
    document.addEventListener('pointermove', move)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointermove', move)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [enabled])

  const change = (hex: string) => {
    if (!session) return
    const c = session.cands[session.index]
    c.el.style.setProperty(c.prop, hex) 
    mark(c.el, c.prop)
    setSession({ ...session, values: session.values.map((v, i) => (i === session.index ? hex : v)) })
  }

  const cancel = () => {
    session?.cands.forEach((c, i) => {
      c.el.style.setProperty(c.prop, session.originals[i])
      if (!session.originals[i]) unmark(c.el, c.prop)
    })
    setSession(null)
  }

  if (!enabled) return null
  const active = session?.cands[session.index]
  const box = active ? active.el.getBoundingClientRect() : hover

  return createPortal(
    <>
      {box && (
        <div
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          className={`pointer-events-none fixed z-40 outline-2 outline-white mix-blend-difference ${active ? '' : 'outline-dashed'}`}
        />
      )}

      {session && active && (
        <ColorPicker
          key={session.index}
          label={active.label}
          value={session.values[session.index]}
          onChange={change}
          swatches={swatches}
          anchor={new DOMRect(session.x, session.y, 0, 0)}
          onClose={cancel}
          header={
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-semibold">{active.label}</span>
                <span className="text-slate-500"> · only this {`<${active.el.tagName.toLowerCase()}>`}</span>
              </div>
              {session.cands.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {session.cands.map((c, i) => (
                    <button
                      key={c.prop}
                      type="button"
                      onClick={() => setSession({ ...session, index: i })}
                      className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs ${
                        i === session.index ? 'border-slate-900 bg-slate-100' : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <span style={{ backgroundColor: session.values[i] }} className="size-3 rounded-full ring-1 ring-black/20" />
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          }
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancel}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 py-2 text-sm hover:bg-slate-100"
              >
                <X size={16} /> Cancel
              </button>
              <button
                type="button"
                onClick={() => setSession(null)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                <Check size={16} /> Apply
              </button>
            </div>
          }
        />
      )}
    </>,
    document.body,
  )
}