/**
 * test-setup.js — Global test setup for Vitest + @testing-library/react
 */

import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './msw-handlers.js'

// Polyfill localStorage for jsdom
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
    key: (index) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Polyfill window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset state after each test
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
  cleanup()
  localStorageMock.clear()
})

// Stop MSW after all tests
afterAll(() => server.close())

// Mock GSAP to prevent animation errors in jsdom
vi.mock('gsap', () => ({
  default: {
    from: vi.fn(),
    to: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => ({ from: vi.fn(), to: vi.fn() })),
    registerPlugin: vi.fn(),
  },
}))

vi.mock('@gsap/react', () => ({
  useGSAP: vi.fn((fn) => { if (fn) fn() }),
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}))
