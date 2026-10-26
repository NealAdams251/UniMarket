// Keeps search, category, condition, price and sort in the URL
// (e.g. /?category=textbooks&sort=price_asc). That way filters survive a
// refresh, the back button works, and filtered pages can be shared.
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

export const FILTER_KEYS = ['q', 'category', 'condition', 'minPrice', 'maxPrice', 'sort']

export function useListingFilters() {
  const [params, setParams] = useSearchParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) ?? '']))

  // update({ category: 'dorm' }) — an empty value removes that filter.
  function update(changes) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === '' || value == null) next.delete(key)
      else next.set(key, value)
    }
    if (pathname === '/') {
      setParams(next, { replace: true })
    } else {
      // From the item page, filtering takes you back to the results.
      const search = next.toString()
      navigate({ pathname: '/', search: search ? `?${search}` : '' })
    }
  }

  function clear() {
    update(Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])))
  }

  const activeCount = FILTER_KEYS.filter((key) => key !== 'sort' && filters[key] !== '').length

  return { filters, update, clear, activeCount }
}
