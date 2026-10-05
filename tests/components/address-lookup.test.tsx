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
  initialLine?: string
  describedBy?: string
  onAddressLineChange?: (v: string) => void
  onPostcodeResolved?: (v: string) => void
}) {
  const [line, setLine] = useState(props.initialLine ?? '')
  return (
    <AddressLookup
      postcode={props.postcode ?? 'G31 4HS'}
      describedBy={props.describedBy}
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
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Finding addresses…')
    await screen.findByLabelText('Select your address')
    expect(screen.getByRole('status')).toBe(status)

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
    expect(screen.getByRole('status')).toHaveTextContent('2 addresses found. Select your address.')

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

    expect(screen.getByRole('status')).toHaveTextContent('Selected: 7 Example Street, Glasgow')
    const select = screen.getByLabelText('Select your address')
    expect(select).toHaveValue('abc')
    expect(select).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Change' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enter address manually' })).toBeInTheDocument()
  })

  it('resolves only the settled choice and keeps the line empty until it resolves', async () => {
    let release: (v: unknown) => void = () => {}
    routeFetch({
      lookup: () => reply(200, { addresses: [...SUGGESTIONS, { id: 'ghi', label: '11 Example Street, Glasgow' }] }),
      resolve: () =>
        new Promise((resolve) => {
          release = resolve
        }),
    })
    const onAddressLineChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onAddressLineChange={onAddressLineChange} />)
    const select = await screen.findByLabelText('Select your address')

    await user.selectOptions(select, 'abc')
    await user.selectOptions(select, 'def')
    await user.selectOptions(select, 'ghi')
    expect(onAddressLineChange).toHaveBeenLastCalledWith('')

    await waitFor(() => expect(callsTo('/api/address/resolve')).toHaveLength(1))
    expect((callsTo('/api/address/resolve')[0]![1] as RequestInit).body).toBe('{"id":"ghi"}')
    expect(onAddressLineChange).toHaveBeenLastCalledWith('')
    expect(onAddressLineChange).not.toHaveBeenCalledWith(expect.stringContaining('Example'))

    release(reply(200, { addressLine: '11 Example Street, Glasgow', postcode: 'G31 4HS' }))
    await waitFor(() => expect(onAddressLineChange).toHaveBeenLastCalledWith('11 Example Street, Glasgow'))
    await new Promise((r) => setTimeout(r, 700))
    expect(callsTo('/api/address/resolve')).toHaveLength(1)
  })

  it('resolves straight away when the select loses focus', async () => {
    routeFetch({
      lookup: () => reply(200, { addresses: SUGGESTIONS }),
      resolve: () => reply(200, { addressLine: '9 Example Street, Glasgow', postcode: 'G31 4HS' }),
    })
    const user = userEvent.setup()
    render(
      <>
        <Harness />
        <button type="button">elsewhere</button>
      </>,
    )
    await user.selectOptions(await screen.findByLabelText('Select your address'), 'def')
    await user.click(screen.getByRole('button', { name: 'elsewhere' }))
    expect(callsTo('/api/address/resolve')).toHaveLength(1)
  })

  it('clears the line when the placeholder is chosen again', async () => {
    routeFetch({
      lookup: () => reply(200, { addresses: SUGGESTIONS }),
      resolve: () => reply(200, { addressLine: '7 Example Street, Glasgow', postcode: 'G31 4HS' }),
    })
    const onAddressLineChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onAddressLineChange={onAddressLineChange} />)
    const select = await screen.findByLabelText('Select your address')
    await user.selectOptions(select, 'abc')
    await waitFor(() => expect(onAddressLineChange).toHaveBeenLastCalledWith('7 Example Street, Glasgow'))
    await user.selectOptions(select, '')
    expect(onAddressLineChange).toHaveBeenLastCalledWith('')
  })

  it('restores the found-count status when the placeholder is re-picked', async () => {
    routeFetch({ lookup: () => reply(200, { addresses: SUGGESTIONS }) })
    const user = userEvent.setup()
    render(<Harness />)
    const select = await screen.findByLabelText('Select your address')
    await user.selectOptions(select, 'abc')
    expect(screen.getByRole('status')).toHaveTextContent('')
    await user.selectOptions(select, '')
    expect(screen.getByRole('status')).toHaveTextContent('2 addresses found. Select your address.')
  })

  it('does not resolve (billable) when focus leaves the select for "Enter address manually"', async () => {
    routeFetch({
      lookup: () => reply(200, { addresses: SUGGESTIONS }),
      resolve: () => reply(200, { addressLine: '7 Example Street, Glasgow', postcode: 'G31 4HS' }),
    })
    const user = userEvent.setup()
    render(<Harness />)
    await user.selectOptions(await screen.findByLabelText('Select your address'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Enter address manually' }))
    await new Promise((r) => setTimeout(r, 600))
    expect(callsTo('/api/address/resolve')).toHaveLength(0)
  })

  it('opens in manual mode, prefilled, when an address line already exists', async () => {
    routeFetch({ lookup: () => reply(200, { addresses: SUGGESTIONS }) })
    render(<Harness initialLine="3 Earlier Road" />)
    expect(await screen.findByLabelText('Address')).toHaveValue('3 Earlier Road')
    expect(screen.getByRole('button', { name: 'Choose from the list instead' })).toBeInTheDocument()
  })

  it('keeps the picked address when the parent echoes back a different canonical postcode', async () => {
    routeFetch({
      lookup: () => reply(200, { addresses: SUGGESTIONS }),
      resolve: () => reply(200, { addressLine: '7 Example Street, Glasgow', postcode: 'g314hs' }),
    })
    const onAddressLineChange = vi.fn()
    const onPostcodeResolved = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <Harness postcode="G31 4HT" onAddressLineChange={onAddressLineChange} onPostcodeResolved={onPostcodeResolved} />,
    )
    await user.selectOptions(await screen.findByLabelText('Select your address'), 'abc')
    await waitFor(() => expect(onPostcodeResolved).toHaveBeenCalledWith('G31 4HS'))
    rerender(<Harness postcode="G31 4HS" onAddressLineChange={onAddressLineChange} onPostcodeResolved={onPostcodeResolved} />)
    await new Promise((r) => setTimeout(r, 400))
    expect(callsTo('/api/address/lookup')).toHaveLength(1)
    expect(onAddressLineChange).toHaveBeenLastCalledWith('7 Example Street, Glasgow')
    expect(screen.getByLabelText('Select your address')).toHaveValue('abc')
  })

  it('clears a picked address when the postcode changes', async () => {
    routeFetch({
      lookup: () => reply(200, { addresses: SUGGESTIONS }),
      resolve: () => reply(200, { addressLine: '7 Example Street, Glasgow', postcode: 'G31 4HS' }),
    })
    const onAddressLineChange = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(<Harness onAddressLineChange={onAddressLineChange} />)
    await user.selectOptions(await screen.findByLabelText('Select your address'), 'abc')
    await waitFor(() => expect(onAddressLineChange).toHaveBeenLastCalledWith('7 Example Street, Glasgow'))
    rerender(<Harness postcode="G32 1AA" onAddressLineChange={onAddressLineChange} />)
    expect(onAddressLineChange).toHaveBeenLastCalledWith('')
    expect(await screen.findByLabelText('Select your address')).toHaveValue('')
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
    expect(screen.getByRole('status')).toHaveTextContent(
      "We couldn't find addresses for that postcode. Please type your address.",
    )
  })

  it('describes the manual input with the caller hint and the lookup status', async () => {
    routeFetch({ lookup: () => reply(404, { error: 'not_found' }) })
    render(<Harness describedBy="book-home-hint" />)
    const input = await screen.findByLabelText('Address')
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ')
    expect(ids[0]).toBe('book-home-hint')
    expect(document.getElementById(ids[1]!)?.textContent).toBe(
      "We couldn't find addresses for that postcode. Please type your address.",
    )
  })

  it('switches to manual entry and back to the list', async () => {
    routeFetch({ lookup: () => reply(200, { addresses: SUGGESTIONS }) })
    const onAddressLineChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onAddressLineChange={onAddressLineChange} />)
    await screen.findByLabelText('Select your address')

    await user.click(screen.getByRole('button', { name: 'Enter address manually' }))
    const input = screen.getByLabelText('Address')
    await user.type(input, '1 Typed Road')
    expect(input).toHaveValue('1 Typed Road')
    expect(screen.queryByLabelText('Select your address')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Choose from the list instead' }))
    expect(onAddressLineChange).toHaveBeenLastCalledWith('')
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
