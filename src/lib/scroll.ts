import type { MouseEvent } from 'react'

export function jumpToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0
  const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8
  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
}

// Плавная прокрутка по якорю «промахивается» из-за картинок, которые подгружаются по пути и растят страницу.
// Поэтому прыгаем к блоку сразу и подправляем позицию, пока картинки рядом успевают загрузиться.
// Если пользователь сам начал прокручивать страницу, подправлять больше не нужно.
const RECHECK_DELAYS = [400, 1000]
const USER_SCROLL_EVENTS = ['wheel', 'touchmove', 'keydown', 'mousedown'] as const

export function scrollToSection(id: string): boolean {
  if (!document.getElementById(id)) return false

  jumpToSection(id)

  const timers = RECHECK_DELAYS.map((delay) => window.setTimeout(() => jumpToSection(id), delay))
  const stop = () => {
    timers.forEach((timer) => window.clearTimeout(timer))
    USER_SCROLL_EVENTS.forEach((name) => window.removeEventListener(name, stop))
  }
  USER_SCROLL_EVENTS.forEach((name) => window.addEventListener(name, stop, { passive: true }))
  window.setTimeout(stop, RECHECK_DELAYS[RECHECK_DELAYS.length - 1] + 50)
  return true
}

export function createAnchorClickHandler(onNavigate?: () => void) {
  return (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest('a[href^="#"]')
    const id = link?.getAttribute('href')?.slice(1)
    if (!id || !document.getElementById(id)) return

    event.preventDefault()
    onNavigate?.()
    scrollToSection(id)
    window.history.replaceState(null, '', `#${id}`)
  }
}
