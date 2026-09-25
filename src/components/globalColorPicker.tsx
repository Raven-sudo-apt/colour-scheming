import { useEffect, useRef, useState, type KeyboardEvent as RKeyEvent, type PointerEvent as RPointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Pipette } from 'lucide-react'

type HSV = { h: number; s: number; v: number }
type RGB = [number, number, number]
type Props = {
  value: string
  onChange: (hex: string) => void
  label?: string
  swatches?: string[]
  anchor?: DOMRect | null
  onClose?: () => void
  header?: ReactNode
  footer?: ReactNode
}
const W = 240
const H = 440
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n))

const place = (r: DOMRect, avoid?: DOMRect | null) => {
  const block = avoid ?? r
  return {
    left: block.left - W - 12 >= 8 ? block.left - W - 12 : Math.min(block.right + 12, window.innerWidth - W - 8),
    top: Math.max(8, Math.min(r.top - 16, window.innerHeight - H - 8)),
  }
}

function parseHex(str: string): RGB | null {
  let h = str.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB
}

function hsvToRgb({ h, s, v }: HSV): RGB {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return [f(5), f(3), f(1)].map((x) => Math.round(x * 255)) as RGB
}

function rgbToHsv([r, g, b]: RGB): HSV {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = (h * 60 + 360) % 360
  }
  return { h, s: max ? d / max : 0, v: max }
}

const hsvToHex = (hsv: HSV) => '#' + hsvToRgb(hsv).map((n) => n.toString(16).padStart(2, '0')).join('')
const hexToHsv = (hex: string) => rgbToHsv(parseHex(hex) ?? [0, 0, 0])

function useDrag(onMove: (x: number, y: number) => void) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: RPointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    onMove(clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height))
  }
  return {
    ref,
    onPointerDown: (e: RPointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      move(e)
    },
    onPointerMove: (e: RPointerEvent) => {
      if (e.buttons) move(e)
    },
  }
}

type EyeDropperCtor = new () => { open(): Promise<{ sRGBHex: string }> }

export default function ColorPicker({ value, onChange, label = 'color', swatches = [], anchor, onClose, header, footer }: Props) {
  const controlled = anchor !== undefined
  const [openState, setOpen] = useState(false)
  const [menuPos, setPos] = useState({ top: 0, left: 0 })
  const open = controlled ? anchor !== null : openState
  const pos = controlled && anchor ? place(anchor) : menuPos
  const [hsv, setHsv] = useState(() => hexToHsv(value))
  const [prev, setPrev] = useState(value)
  const [draft, setDraft] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  const hex = hsvToHex(hsv)

  if (value !== prev) {
    setPrev(value)
    if (value.toLowerCase() !== hex) setHsv(hexToHsv(value))
  }

  const update = (next: HSV) => {
    setHsv(next)
    onChange(hsvToHex(next))
  }
  const setFromHex = (h: string) => {
    const rgb = parseHex(h)
    if (rgb) update(rgbToHsv(rgb))
  }

  const sv = useDrag((x, y) => update({ ...hsv, s: x, v: 1 - y }))
  const hue = useDrag((x) => update({ ...hsv, h: x * 360 }))

  const toggle = () => {
    if (!open) {
      const panel = triggerRef.current!.closest('[data-color-ui]')
      setPos(place(triggerRef.current!.getBoundingClientRect(), panel?.getBoundingClientRect()))
    }
    setOpen((o) => !o)
  }


  useEffect(() => {
    if (!open) return
    const close = () => (controlled ? onClose?.() : setOpen(false))
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (!controlled && !popRef.current?.contains(t) && !triggerRef.current?.contains(t)) close()
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    if (!controlled) {
      window.addEventListener('resize', close)
      window.addEventListener('scroll', close, true)
    }
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open, controlled, onClose])

  const svKeys = (e: RKeyEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step],
    }
    if (!d[e.key]) return
    e.preventDefault()
    update({ ...hsv, s: clamp(hsv.s + d[e.key][0]), v: clamp(hsv.v + d[e.key][1]) })
  }
  const hueKeys = (e: RKeyEvent) => {
    const step = e.shiftKey ? 10 : 2
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    update({ ...hsv, h: clamp(hsv.h + (e.key === 'ArrowRight' ? step : -step), 0, 360) })
  }

  const EyeDropper = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper
  const pickFromScreen = async () => {
    try {
      const { sRGBHex } = await new EyeDropper!().open()
      setFromHex(sRGBHex)
    } catch {
    }
  }

  const ring = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900'

  return (
    <>
      {!controlled && <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label={`Pick ${label} color`}
        aria-expanded={open}
        style={{ backgroundColor: value }}
        className={`size-8 cursor-pointer rounded-lg shadow-inner ring-1 ring-black/20 ${ring}`}
      />}

      {open &&
        createPortal(
          <div
            ref={popRef}
            role="dialog"
            data-color-ui
            aria-label={`${label} color picker`}
            style={{ top: pos.top, left: pos.left, width: W }}
            className="fixed z-60 space-y-3 rounded-2xl bg-white p-3 font-sans text-slate-900 shadow-2xl ring-1 ring-slate-200"
          >
            {header}

            <div
              {...sv}
              tabIndex={0}
              autoFocus
              role="slider"
              aria-label="Saturation and brightness"
              aria-valuenow={Math.round(hsv.s * 100)}
              aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
              onKeyDown={svKeys}
              style={{
                backgroundColor: `hsl(${hsv.h} 100% 50%)`,
                backgroundImage: 'linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent)',
              }}
              className={`relative h-36 w-full cursor-crosshair touch-none rounded-lg ${ring}`}
            >
              <span
                style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hex }}
                className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
              />
            </div>

            <div
              {...hue}
              tabIndex={0}
              role="slider"
              aria-label="Hue"
              aria-valuemin={0}
              aria-valuemax={360}
              aria-valuenow={Math.round(hsv.h)}
              onKeyDown={hueKeys}
              style={{ backgroundImage: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
              className={`relative h-3.5 w-full cursor-pointer touch-none rounded-full ${ring}`}
            >
              <span
                style={{ left: `${(hsv.h / 360) * 100}%`, backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
                className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
              />
            </div>

            <div className="flex items-center gap-2">
              <span style={{ backgroundColor: hex }} className="size-9 shrink-0 rounded-lg ring-1 ring-black/20" />
              <input
                value={draft ?? hex}
                onChange={(e) => {
                  setDraft(e.target.value)
                  setFromHex(e.target.value)
                }}
                onBlur={() => setDraft(null)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                spellCheck={false}
                aria-label="Hex value"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm uppercase focus:border-slate-900 focus:outline-none"
              />
              {EyeDropper && (
                <button
                  type="button"
                  onClick={pickFromScreen}
                  aria-label="Pick a color from the screen"
                  className={`rounded-lg border border-slate-300 p-2 hover:bg-slate-100 ${ring}`}
                >
                  <Pipette size={16} />
                </button>
              )}
            </div>

            {swatches.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {swatches.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFromHex(c)}
                    aria-label={`Use ${c}`}
                    style={{ backgroundColor: c }}
                    className={`size-6 rounded-md ring-1 ring-black/20 hover:scale-110 ${ring}`}
                  />
                ))}
              </div>
            )}
            {footer}
          </div>,
          document.body,
        )}
    </>
  )
}