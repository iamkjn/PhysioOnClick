import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock firebase-admin/firestore (used for FieldValue.serverTimestamp() in the route)
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue('__SERVER_TIMESTAMP__'),
  },
  getFirestore: vi.fn(),
}))

// Mock firebase-admin before importing the route
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => ({
    collection: () => ({
      add: vi.fn().mockResolvedValue({ id: 'mock-booking-id' }),
    }),
  }),
  getAdminAuth: () => ({
    generateSignInWithEmailLink: vi.fn().mockResolvedValue('https://example.com/auth/verify'),
  }),
}))

// Mock google-calendar
vi.mock('@/lib/google-calendar', () => ({
  createEventWithMeet: vi.fn().mockResolvedValue({
    meetLink: 'https://meet.google.com/mock',
    eventId: 'mock-event-id',
  }),
}))

// Mock client-side firebase (imported transitively)
vi.mock('@/lib/firebase', () => ({
  auth: null,
  db: null,
  storage: null,
}))

// Mock fetch for Resend email API
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
})

import { POST } from '@/app/api/booking/route'

const validBody = {
  fullName: 'Jane Smith',
  email: 'jane@example.com',
  phone: '07700900000',
  service: 'Musculoskeletal Physiotherapy',
  appointmentDate: '2026-07-01',
  appointmentTime: '09:00',
  notes: '',
  consent: true,
}

function makeRequest(body: object): Request {
  return new Request('http://localhost/api/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/booking', () => {
  it('returns 400 when consent is false', async () => {
    const res = await POST(makeRequest({ ...validBody, consent: false }))
    expect(res.status).toBe(400)
    const data = await res.json() as { error: string }
    expect(data.error).toBe('Consent is required.')
  })

  it('returns 200 when all required fields are present and consent is true', async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const data = await res.json() as { ok: boolean }
    expect(data.ok).toBe(true)
  })

  it('returns 400 when a required field is missing', async () => {
    const { email: _removed, ...withoutEmail } = validBody
    const res = await POST(makeRequest({ ...withoutEmail, consent: true }))
    expect(res.status).toBe(400)
    const data = await res.json() as { error: string }
    expect(data.error).toBe('Missing required booking details.')
  })
})
