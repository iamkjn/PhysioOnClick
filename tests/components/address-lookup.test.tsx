import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AddressLookup } from '@/components/address-lookup'

// Postcode -> "Select your address" dropdown, with a manual fallback for every
// failure. The 300 ms debounce runs on real timers; findBy*/waitFor cover it.

const SUGGESTIONS = [
  { id: 'abc', label: '7 Example Street, Glasgow' },
  { id: 'def', label: '9 Example Street, Glasgow' },
]

const fetchMock = vi.fn()

function reply(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function routeFetch(handlers: { lookup?: () => unknown; resolve?: () => unknown }) {
  fetchMock.mockImplementation(async (url: string) => {
    if (String(url) === '/api/address/lookup') return handlers.lookup?.() ?? reply(503, { error: 'unavailable' })
    if (String(url) === '/api/address/resolve') return handlers.resolve?.() ?? reply(503, { error: 'unavailable' })
    throw new Error(`unexpected fetch ${url}`)
  })
}

function callsTo(path: string) {
  return fetchMock.mock.calls.filter(([url]) => String(url) === path)
}

function Harness(props: {
  postcode?: string
  onAddressLineChange?: (v: string) => void
  onPostcodeResolved?: (v: string) => void
}) {
  const [line, setLine] = useState('')
  return (
    <AddressLookup
      postcode={props.postcode ?? 'G31 4HS'}
      addressLine={line}
      onAddressLineChange={(v) => {
        setLine(v)
        props.onAddressLineChange?.(v)
      }}
      onPostcodeResolved={props.onPostcodeResolved}
    />
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('AddressLookup', () => {
  it('POSTs the postcode as JSON and lists the suggestions under a placeholder', async () => {
    routeFetch({ lookup: () => reply(200, { addresses: SUGGESTIONS }) })
    render(<Harness />)
    expect(screen.getByRole('status')).toHaveTextContent('Finding addresses…')

    const select = await screen.findByLabelText('Select your address')
    expect(select.tagName).toBe('SELECT')
    expect(select).toHaveAttribute('id', 'book-home-address-select')
    const options = [...(select as HTMLSelectElement).options].map((o) => [o.value, o.textContent])
    expect(options).toEqual([
      ['', 'Choose your address'],
      ['abc', '7 Example Street, Glasgow'],
      ['def', '9 Example Street, Glasgow'],
    ])
    expect(screen.getByRole('button', { name: 'Enter address manually' })).toBeInTheDocument()

    const calls = callsTo('/api/address/lookup')
    expect(calls).toHaveLength(1)
    const init = calls[0]![1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"postcode":"G31 4HS"}')
    expect(String(calls[0]![0])).not.toContain('G31')
  })

  it('resolves a picked suggestion and reports the address line and canonical postcode', async () => {
    routeFetch({
      lookup: () => reply(200, { addresses: SUGGESTIONS }),
      resolve: () => reply(200, { addressLine: '7 Example Street, Glasgow', postcode: 'G31 4HS' }),
    })
    const onAddressLineChange = vi.fn()
    const onPostcodeResolved = vi.fn()
    const user = userEvent.setup()
    render(<Harness onAddressLineChange={onAddressLineChange} onPostcodeResolved={onPostcodeResolved} />)

    await user.selectOptions(await screen.findByLabelText('Select your address'), 'abc')

    await waitFor(() => expect(onAddressLineChange).toHaveBeenCalledWith('7 Example Street, Glasgow'))
    expect(onPostcodeResolved).toHaveBeenCalledWith('G31 4HS')
    const resolve = callsTo('/api/address/resolve')
    expect(resolve).toHaveLength(1)
    expect((resolve[0]![1] as RequestInit).method).toBe('POST')
    expect((resolve[0]![1] as RequestInit).body).toBe('{"id":"abc"}')

    expect(screen.getByText('7 Example Street, Glasgow', { selector: 'p' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Change' }))
    expect(screen.getByLabelText('Select your address')).toBeInTheDocument()
  })

  it('falls back silently to the manual Address input when lookup is unavailable (503)', async () => {
    routeFetch({ lookup: () => reply(503, { error: 'unavailable' }) })
    render(<Harness />)
    const input = await screen.findByLabelText('Address')
    expect(input.tagName).toBe('INPUT')
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('maxLength', '120')
    expect(input).toHaveAttribute('autocomplete', 'street-address')
    expect(input).toHaveAttribute('id', 'book-home-address')
    expect(screen.queryByText(/couldn't/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Choose from the list instead' })).not.toBeInTheDocument()
  })

  it('falls back silently on a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<Harness />)
    expect(await screen.findByLabelText('Address')).toBeInTheDocument()
    expect(screen.queryByText(/couldn't/i)).not.toBeInTheDocument()
  })

  it('explains a 404 and shows the manual input', async () => {
    routeFetch({ lookup: () => reply(404, { error: 'not_found' }) })
    render(<Harness />)
    expect(await screen.findByLabelText('Address')).toBeInTheDocument()
    expect(
      screen.getByText("We couldn't find addresses for that postcode. Please type your address."),
    ).toBeInTheDocument()
  })

  it('switches to manual entry and back to the list', async () => {
    routeFetch({ lookup: () => reply(200, { addresses: SUGGESTIONS }) })
    const user = userEvent.setup()
    render(<Harness />)
    await screen.findByLabelText('Select your address')

    await user.click(screen.getByRole('button', { name: 'Enter address manually' }))
    const input = screen.getByLabelText('Address')
    await user.type(input, '1 Typed Road')
    expect(input).toHaveValue('1 Typed Road')
    expect(screen.queryByLabelText('Select your address')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Choose from the list instead' }))
    expect(screen.getByLabelText('Select your address')).toHaveValue('')
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument()
  })

  it('falls back to manual entry when resolving the picked address fails', async () => {
    routeFetch({
      lookup: () => reply(200, { addresses: SUGGESTIONS }),
      resolve: () => reply(503, { error: 'unavailable' }),
    })
    const onAddressLineChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onAddressLineChange={onAddressLineChange} />)
    await user.selectOptions(await screen.findByLabelText('Select your address'), 'abc')

    expect(await screen.findByLabelText('Address')).toBeInTheDocument()
    expect(screen.getByText("We couldn't fetch that address. Please type it below.")).toBeInTheDocument()
    expect(onAddressLineChange).not.toHaveBeenCalledWith('7 Example Street, Glasgow')
  })

  it('ignores a stale lookup when the postcode changes', async () => {
    let releaseFirst: (v: unknown) => void = () => {}
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const { postcode } = JSON.parse(String(init.body)) as { postcode: string }
      if (postcode === 'G31 4HS') {
        return new Promise((resolve) => {
          releaseFirst = resolve
        })
      }
      return reply(200, { addresses: [{ id: 'xyz', label: '1 Other Road, Glasgow' }] })
    })
    const { rerender } = render(<Harness postcode="G31 4HS" />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    rerender(<Harness postcode="G32 1AA" />)
    const select = await screen.findByLabelText('Select your address')
    releaseFirst(reply(200, { addresses: SUGGESTIONS }))
    await new Promise((r) => setTimeout(r, 50))
    expect([...(select as HTMLSelectElement).options].map((o) => o.value)).toEqual(['', 'xyz'])
  })
})
