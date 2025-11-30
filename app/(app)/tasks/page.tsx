'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusIcon, MapPinIcon, FilterIcon, RotateCcwIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PostTaskDialog } from '@/components/ui/post-task-dialog'
import TaskCard from '@/components/tasks/TaskCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { calculateDistance } from '@/lib/geolocation'
import { useRealtime } from '@/hooks/useRealtime'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const SUBJECT_FILTERS = [
  "All subjects",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "Economics",
  "Biology",
  "Literature",
  "Other"
]

const FILTERS_STORAGE_KEY = 'finishmywork:task-filters'

// Local Task type used for browse page
interface Task {
  id: number
  title: string
  description: string
  subject: string
  deadline: string
  budget: number | string
  status: string
  location?: string
  latitude?: number | null
  longitude?: number | null
  createdAt: string
  poster?: {
    name?: string
    university?: string
  } | null
  posterId?: number
  accepterId?: number | null
}

export default function TasksPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const { connected, on } = useRealtime()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All subjects')
  const [deadlineWindow, setDeadlineWindow] = useState('ANY')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [sortOption, setSortOption] = useState('NEWEST')
  const [userLocation, setUserLocation] = useState<string | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [showAllLocations, setShowAllLocations] = useState(true)
  const [radiusKm, setRadiusKm] = useState(4)
  const didLoadFiltersRef = useRef(false)
  
  useEffect(() => {
    fetchTasks()
    fetchUserLocation()

    // Load filters from localStorage
    try {
      const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY)
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters)
        setSearchTerm(parsedFilters.searchTerm || '')
        setSubjectFilter(parsedFilters.subjectFilter || 'All subjects')
        setDeadlineWindow(parsedFilters.deadlineWindow || 'ANY')
        setMinBudget(parsedFilters.minBudget || '')
        setMaxBudget(parsedFilters.maxBudget || '')
        setSortOption(parsedFilters.sortOption || 'NEWEST')
        setShowAllLocations(parsedFilters.showAllLocations ?? true)
        setRadiusKm(parsedFilters.radiusKm || 4)
      }
    } catch {
      // If there's an error, just use defaults
    } finally {
      didLoadFiltersRef.current = true
    }
  }, [])

  // Persist filters when they change (after initial load)
  useEffect(() => {
    if (!didLoadFiltersRef.current) return
    try {
      const toSave = {
        searchTerm,
        subjectFilter,
        deadlineWindow,
        minBudget,
        maxBudget,
        sortOption,
        showAllLocations,
        radiusKm,
      }
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(toSave))
    } catch {}
  }, [searchTerm, subjectFilter, deadlineWindow, minBudget, maxBudget, sortOption, showAllLocations, radiusKm])

  const resetFilters = () => {
    setSubjectFilter('All subjects')
    setDeadlineWindow('ANY')
    setMinBudget('')
    setMaxBudget('')
    setRadiusKm(4)
    setShowAllLocations(true)
  }

  const hasActiveFilters = 
    subjectFilter !== 'All subjects' || 
    deadlineWindow !== 'ANY' || 
    minBudget !== '' || 
    maxBudget !== '' || 
    !showAllLocations

  // Listen for new tasks via SSE
  useEffect(() => {
    const unsubscribe = on('task:created', (event) => {
      if (event.type !== 'task:created') return
      const task = event.data.task as Task
      if (!task) return
      
      setTasks((prev) => {
        const filtered = prev.filter((existing) => existing.id !== task.id)
        return [task, ...filtered]
      })
      
      // Show toast notification for new tasks
      toast({
        title: '🆕 New Task Available!',
        description: `${task.title} - ₹${task.budget}`,
        duration: 4000,
      })
    })

    return unsubscribe
  }, [on, toast])

  // Listen for task updates via SSE
  useEffect(() => {
    const unsubscribe = on('task:updated', (event) => {
      if (event.type !== 'task:updated') return
      const task = event.data.task as Task
      if (!task) return
      
      setTasks((prev) => {
        const exists = prev.some((existing) => existing.id === task.id)
        if (!exists) return [task, ...prev]
        return prev.map((existing) => (existing.id === task.id ? { ...existing, ...task } : existing))
      })
    })

    return unsubscribe
  }, [on])

  const fetchUserLocation = async () => {
    if (!session?.user?.id) return
    try {
      const response = await fetch('/api/user/location')
      if (!response.ok) return
      const data = await response.json()
      setUserLocation(data.location ?? null)
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        setUserCoords({ lat: data.latitude, lon: data.longitude })
      } else {
        setUserCoords(null)
      }
    } catch (error) {
      console.error('Error fetching user location:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data: Task[] = await response.json()
      setTasks(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to load tasks',
        description: error instanceof Error ? error.message : 'Try refreshing the page.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => {
      const filtered = prev.filter((existing) => existing.id !== task.id)
      return [task, ...filtered]
    })
  }

  const filteredTasks: Task[] = useMemo(() => {
    const now = new Date()
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.subject.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSubject =
        subjectFilter === 'All subjects' || task.subject === subjectFilter

      // Deadline window filter
      let matchesDeadline = true
      if (deadlineWindow !== 'ANY') {
        const deadlineDate = new Date(task.deadline)
        if (!Number.isNaN(deadlineDate.getTime())) {
          const diffMs = deadlineDate.getTime() - now.getTime()
          const within = (hours: number) => diffMs >= 0 && diffMs <= hours * 60 * 60 * 1000
          switch (deadlineWindow) {
            case 'TODAY':
              // before end of today
              const endOfToday = new Date(now)
              endOfToday.setHours(23, 59, 59, 999)
              matchesDeadline = deadlineDate.getTime() <= endOfToday.getTime()
              break
            case '24H':
              matchesDeadline = within(24)
              break
            case '3D':
              matchesDeadline = within(72)
              break
            case '7D':
              matchesDeadline = within(168)
              break
          }
        }
      }

      // Budget range filter
      const toNumber = (val: number | string): number =>
        typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.]/g, ''))
      const budget = toNumber(task.budget)
      const minOk = minBudget === '' || (!Number.isNaN(Number(minBudget)) && budget >= Number(minBudget))
      const maxOk = maxBudget === '' || (!Number.isNaN(Number(maxBudget)) && budget <= Number(maxBudget))

      let matchesLocation = true
      if (!showAllLocations) {
        if (userCoords && typeof task.latitude === 'number' && typeof task.longitude === 'number') {
          const distance = calculateDistance(
            userCoords.lat,
            userCoords.lon,
            task.latitude,
            task.longitude
          )
          matchesLocation = distance <= radiusKm
        } else if (userLocation) {
          // Fallback to exact location match when coordinates are unavailable
          matchesLocation = task.location === userLocation
        } else {
          // If we don't know the user's location at all, conservatively show all
          matchesLocation = true
        }
      }

      return matchesSearch && matchesSubject && matchesDeadline && minOk && maxOk && matchesLocation
    })
  }, [tasks, searchTerm, subjectFilter, deadlineWindow, minBudget, maxBudget, showAllLocations, userLocation, userCoords, radiusKm])

  const sortedTasks: Task[] = useMemo(() => {
    const list: Task[] = [...filteredTasks]
    // Sorting preferences
    if (!showAllLocations && userCoords && sortOption === 'NEWEST') {
      // When near-me is active and no explicit sort chosen (default NEWEST), show nearest first
      list.sort((a, b) => {
        const aHas = typeof a.latitude === 'number' && typeof a.longitude === 'number'
        const bHas = typeof b.latitude === 'number' && typeof b.longitude === 'number'
        if (!aHas && !bHas) return 0
        if (!aHas) return 1
        if (!bHas) return -1
        const da = calculateDistance(userCoords.lat, userCoords.lon, a.latitude!, a.longitude!)
        const db = calculateDistance(userCoords.lat, userCoords.lon, b.latitude!, b.longitude!)
        return da - db
      })
    } else if (sortOption === 'BUDGET_HIGH') {
      const toNumber = (val: number | string): number =>
        typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.]/g, ''))
      list.sort((a, b) => toNumber(b.budget) - toNumber(a.budget))
    } else if (sortOption === 'DEADLINE_SOON') {
      list.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    } else {
      // NEWEST default
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return list
  }, [filteredTasks, showAllLocations, userCoords, sortOption])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="animate-spin rounded-full border border-border/40 border-t-[color:var(--accent-from)] p-6" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-2">
        <div className="flex flex-col-reverse gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 text-left">
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground text-left">Tasks</h1>
            <p className="text-xs md:text-sm text-muted-foreground text-left">
              Browse active study requests and lend a hand in real time.
            </p>
          </div>
          <PostTaskDialog
            onCreated={handleTaskCreated}
            trigger={
              <Button variant="gradient" className="flex items-center justify-center gap-2 rounded-xl px-6 py-3">
                <PlusIcon className="size-4" />
                Post task
              </Button>
            }
          />
        </div>

        <div
          className={cn(
            'sticky top-20 md:top-28 z-10 flex flex-wrap items-center gap-2 md:gap-3 rounded-2xl border border-border/40 bg-gradient-to-br from-background/95 via-background/90 to-background/85 px-3 md:px-5 py-2.5 md:py-3 backdrop-blur-3xl shadow-[0_8px_32px_-12px_rgba(129,140,248,0.12)]',
          )}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Input
              placeholder="Search by title, subject, or keywords…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 rounded-xl border-border/50 bg-surface/90 pl-10 text-sm shadow-inner backdrop-blur-sm transition-all focus:bg-surface focus:shadow-[inset_0_2px_8px_rgba(129,140,248,0.08)]"
            />
            <svg className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 sm:inline">Sort</span>
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as typeof sortOption)}>
              <SelectTrigger className="h-10 w-[140px] md:w-[160px] rounded-xl border-border/50 bg-surface/90 text-sm shadow-inner backdrop-blur-sm transition-all hover:bg-surface">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEWEST">Newest</SelectItem>
                <SelectItem value="BUDGET_HIGH">Budget: High to Low</SelectItem>
                <SelectItem value="DEADLINE_SOON">Deadline: Soonest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-xl border px-4 shadow-inner backdrop-blur-sm transition-all hover:bg-surface active:scale-95",
                  hasActiveFilters 
                    ? "border-[color:var(--accent-from)]/40 bg-[color:var(--accent-from)]/10 text-[color:var(--accent-from)]" 
                    : "border-border/50 bg-surface/90 text-muted-foreground"
                )}
                aria-label="Open filters"
              >
                <FilterIcon className="size-4" />
                <span className="hidden text-sm font-medium sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent-from)] text-[10px] font-bold text-white">
                    {[
                      subjectFilter !== 'All subjects',
                      deadlineWindow !== 'ANY',
                      minBudget !== '' || maxBudget !== '',
                      !showAllLocations
                    ].filter(Boolean).length}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent 
              align="end" 
              className="w-[92vw] max-w-[340px] rounded-2xl border border-border/60 bg-card/95 p-5 shadow-2xl backdrop-blur-3xl"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Filter Tasks</h3>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Subject Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
                    Subject
                  </label>
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="h-10 w-full rounded-xl border-border/50 bg-surface/90 text-sm shadow-inner backdrop-blur-sm transition-all hover:bg-surface">
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_FILTERS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Deadline Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
                    Deadline
                  </label>
                  <Select value={deadlineWindow} onValueChange={(v) => setDeadlineWindow(v as typeof deadlineWindow)}>
                    <SelectTrigger className="h-10 w-full rounded-xl border-border/50 bg-surface/90 text-sm shadow-inner backdrop-blur-sm transition-all hover:bg-surface">
                      <SelectValue placeholder="Any deadline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANY">Any deadline</SelectItem>
                      <SelectItem value="TODAY">Due today</SelectItem>
                      <SelectItem value="24H">Within 24 hours</SelectItem>
                      <SelectItem value="3D">Within 3 days</SelectItem>
                      <SelectItem value="7D">Within 7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
                    Budget Range
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      inputMode="numeric"
                      placeholder="Min"
                      value={minBudget}
                      onChange={(e) => setMinBudget(e.target.value)}
                      className="h-9 flex-1 rounded-lg border-border/50 bg-surface/90 px-3 text-sm shadow-inner backdrop-blur-sm transition-all focus:bg-surface"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      inputMode="numeric"
                      placeholder="Max"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(e.target.value)}
                      className="h-9 flex-1 rounded-lg border-border/50 bg-surface/90 px-3 text-sm shadow-inner backdrop-blur-sm transition-all focus:bg-surface"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-surface/40 text-muted-foreground/70 shadow-inner backdrop-blur-sm transition-all hover:border-[color:var(--accent-from)]/40 hover:bg-[color:var(--accent-from)]/10 hover:text-[color:var(--accent-from)] active:scale-95"
              aria-label="Reset all filters"
              title="Reset all filters"
            >
              <RotateCcwIcon className="size-4" />
            </button>
          )}
        </div>

        {/* Location Indicator Bar */}
        {userLocation && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/30 bg-surface/40 px-4 py-2.5 text-sm text-muted-foreground shadow-inner backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <MapPinIcon className="size-4 text-muted-foreground/70" />
              <span className="text-xs">
                {showAllLocations
                  ? 'Showing all locations'
                  : `Showing tasks near ${userLocation}${userCoords ? ` · within ${radiusKm} km` : ''}`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {!showAllLocations && userCoords && (
                <Select value={String(radiusKm)} onValueChange={(v) => setRadiusKm(Number(v))}>
                  <SelectTrigger className="h-7 w-[130px] rounded-lg border-border/40 bg-background/60 text-xs shadow-inner backdrop-blur-sm transition-all hover:bg-background/80">
                    <SelectValue placeholder="Radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Within 2 km</SelectItem>
                    <SelectItem value="3">Within 3 km</SelectItem>
                    <SelectItem value="4">Within 4 km</SelectItem>
                    <SelectItem value="5">Within 5 km</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <button
                onClick={() => setShowAllLocations((prev) => !prev)}
                className="text-xs font-medium text-foreground/80 transition-all hover:text-[color:var(--accent-from)] active:scale-95"
              >
                {showAllLocations ? 'Only near me' : 'Show everywhere'}
              </button>
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {sortedTasks.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sortedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  transition={{
                    type: 'spring',
                    stiffness: 240,
                    damping: 22,
                    delay: index * 0.04,
                  }}
                >
                  <TaskCard task={task} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-12 text-center"
            >
              <h2 className="text-xl font-semibold text-foreground">No tasks match your filters</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Try adjusting your filters or post a task — your study buddies are just a message away.
              </p>
              <PostTaskDialog
                onCreated={handleTaskCreated}
                trigger={
                  <Button variant="gradient" className="rounded-2xl">
                    Post your first task
                  </Button>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
