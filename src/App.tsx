import { useState } from 'react'
import {
  GraduationCap, LayoutDashboard, CalendarDays, BookOpen, MessageSquare, Settings,
  Clock, ClipboardList, TrendingUp, Megaphone, Plus, MapPin, ChevronLeft, ChevronRight, Users,
} from 'lucide-react'
import ColorPanel from './components/colorPanel'

const nav = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Timetable', icon: CalendarDays },
  { label: 'Assignments', icon: BookOpen },
  { label: 'Messages', icon: MessageSquare },
  { label: 'Settings', icon: Settings },
]

const stats = [
  { icon: Clock, value: '6', title: 'Classes Today', note: 'Next: Year 8 Science, 11:20' },
  { icon: ClipboardList, value: '12', title: 'Homework Due', note: '3 need grading before Friday' },
  { icon: TrendingUp, value: '96%', title: 'Attendance', note: '24 of 612 students absent' },
  { icon: Megaphone, value: '4', title: 'Announcements', note: 'Fire drill notice needs review' },
]

const months = [
  { label: 'September 2026', events: [
    { day: 29, mon: 'Sep', title: 'Whole-School Fire Drill', time: '10:00 – 10:30', place: 'All buildings', tag: 'Safety' },
    { day: 30, mon: 'Sep', title: 'Homework Deadline — Term 1 Projects', time: '16:00', place: 'Submitted online', tag: 'Academics' },
  ]},
  { label: 'October 2026', events: [
    { day: 2, mon: 'Oct', title: 'Parent–Teacher Conferences', time: '14:00 – 19:00', place: 'Main Hall', tag: 'Meetings' },
    { day: 7, mon: 'Oct', title: 'Inter-House Football Cup', time: '13:30 – 16:00', place: 'East Field', tag: 'Sports' },
    { day: 12, mon: 'Oct', title: 'Autumn Break Begins', time: 'All week', place: 'School closed', tag: 'Holiday' },
    { day: 21, mon: 'Oct', title: 'Annual Science Fair', time: '09:00 – 15:00', place: 'Library & Atrium', tag: 'Academics' },
  ]},
]

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export default function App() {
  const [active, setActive] = useState('Dashboard')
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="bg-background text-on-background flex min-h-screen">
      <aside className="bg-sidebar text-text sticky top-0 hidden h-screen w-60 shrink-0 flex-col p-1.5 md:flex">
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="bg-surface text-accent flex size-11 items-center justify-center rounded-full">
            <GraduationCap size={22} />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold">Brookfield</div>
            <div className="text-xs tracking-widest">ACADEMY</div>
          </div>
        </div>

        <nav className="mt-1 space-y-1">
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium ${focus} ${
                active === label ? 'bg-primary text-on-primary' : 'hover:bg-primary/10'
              }`}
            >
              <Icon size={18} className={active === label ? '' : 'text-accent'} />
              {label}
            </button>
          ))}
        </nav>

        <div className="bg-surface mt-auto flex items-center gap-3 rounded-xl p-3">
          <div className="bg-primary text-on-primary flex size-9 items-center justify-center rounded-full text-xs font-bold">MC</div>
          <div className="text-sm leading-tight">
            <div className="font-semibold">Mr. M. Carter</div>
            <div className="text-xs opacity-70">Science Dept.</div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6 md:p-12 md:pt-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Good afternoon, Mr. Carter</h1>
            <p className="mt-1 text-sm opacity-70">{today} · Week 4 of Term 1</p>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label="Notifications" className={`bg-surface text-accent relative flex size-11 items-center justify-center rounded-full ${focus}`}>
              <Megaphone size={18} />
              <span className="bg-primary absolute top-2 right-2 size-2.5 rounded-full" />
            </button>
            <button className={`bg-primary text-on-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold ${focus}`}>
              <Plus size={16} /> New activity
            </button>
          </div>
        </header>

        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">Quick Activities</h2>
            <span className="text-xs tracking-widest opacity-70">TODAY</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ icon: Icon, value, title, note }) => (
              <div key={title} className="bg-surface text-text rounded-3xl p-5">
                <div className="flex items-start justify-between">
                  <Icon size={22} className="text-accent" />
                  <span className="text-primary text-3xl font-bold">{value}</span>
                </div>
                <div className="mt-4 text-sm font-semibold">{title}</div>
                <div className="mt-1 text-xs opacity-80">{note}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Monthly Events</h2>
            <div className="flex items-center gap-3 text-sm font-medium">
              <button aria-label="Previous" className={`bg-surface text-text/50 flex size-9 items-center justify-center rounded-full ${focus}`}><ChevronLeft size={16} /></button>
              Sep – Oct 2026
              <button aria-label="Next" className={`bg-surface text-text flex size-9 items-center justify-center rounded-full ${focus}`}><ChevronRight size={16} /></button>
            </div>
          </div>

          {months.map((m) => (
            <div key={m.label} className="mt-5">
              <div className="mb-3 flex items-center gap-2 text-xs tracking-widest opacity-70">
                <CalendarDays size={14} /> {m.label.toUpperCase()}
              </div>
              <div className="space-y-3">
                {m.events.map((e) => (
                  <article key={e.title} className="bg-surface text-text flex items-center gap-4 rounded-3xl p-4">
                    <div className="bg-primary text-on-primary flex size-14 shrink-0 flex-col items-center justify-center rounded-xl leading-none">
                      <span className="text-xl font-bold">{e.day}</span>
                      <span className="mt-1 text-[10px] font-semibold uppercase">{e.mon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">{e.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-x-4 text-xs opacity-80">
                        <span className="flex items-center gap-1"><Clock size={13} className="text-accent" />{e.time}</span>
                        <span className="flex items-center gap-1"><MapPin size={13} className="text-accent" />{e.place}</span>
                      </div>
                    </div>
                    <span className="bg-secondary rounded-full px-3 py-1 text-xs text-on-secondary font-medium">{e.tag}</span>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>

        <footer className="bg-surface text-text mt-12 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm">
          <Users size={16} className="text-accent" />
          612 students · 48 staff · Term 1 ends Friday 18 December 2026
        </footer>
      </main>

      <ColorPanel />
    </div>
  )
}