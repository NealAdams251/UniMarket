import './Home.css'
import SearchItems from '../../components/SearchItems/SearchItems'
import SearchPanel from '../../components/SearchPanel/SearchPanel'
import ProfileMenu from '../../components/ProfileMenu/ProfileMenu'
import ListingCard from '../../components/ListingCard/ListingCard'
import { useListingFilters } from '../../hooks/useListingFilters'
import { getListings } from '../../lib/listings'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

function Home({ currentUser, setCurrentUser }) {
  const navigate = useNavigate()
  const { filters, update, clear, activeCount } = useListingFilters()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Re-fetch whenever any filter in the URL changes.
  const filterKey = JSON.stringify(filters)
  useEffect(() => {
    let ignore = false
    setLoading(true)
    getListings(JSON.parse(filterKey))
      .then((rows) => { if (!ignore) { setListings(rows); setError('') } })
      .catch(() => { if (!ignore) setError('Could not load listings. Try refreshing.') })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [filterKey])

  return (
    <div className="home-page">

      <SearchPanel />

      <main className="home-main">
        <section className="home-heading">
          <SearchItems showBrand
            value={filters.q} onChange={(q) => update({ q })} />

          {/* TODO: route to the Create Listing page once it exists */}
          <button type="button" className="sell-button"
            onClick={() => {
              if (currentUser) {
                navigate('/CreateListing')
              } else {
                alert('You must be logged in to sell an item. Please log in or sign up first.')
              }
            }}
          >
            Sell Item 
          </button>

          {/* TODO: pass the signed-in user's name from Supabase auth */}
          <ProfileMenu 
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}/>
        </section>

        <div className="results-bar">
          <p className="results-count" aria-live="polite">
            {loading ? 'Loading…' : `${listings.length} ${listings.length === 1 ? 'item' : 'items'}`}
            {activeCount > 0 && !loading && (
              <button type="button" className="results-clear" onClick={clear}>Clear filters</button>
            )}
          </p>
          <label className="sort-control">
            <span>Sort by</span>
            <select
              value={filters.sort || 'newest'}
              onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="results-message">{error}</p>}

        {!loading && !error && listings.length === 0 && (
          <div className="results-message">
            <h3>No items match your search</h3>
            <p>Try another category or clear your filters.</p>
            <button type="button" className="sell-button" onClick={clear}>Clear filters</button>
          </div>
        )}

        <section className="items-list">
          {listings.map((item) => <ListingCard key={item.id} item={item} />)}
        </section>
      </main>
    </div>
  )
}

export default Home
