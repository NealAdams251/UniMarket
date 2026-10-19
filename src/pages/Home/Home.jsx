import './Home.css'
import Sidebar from '../../components/Sidebar/Sidebar'
import SearchPanel from '../../components/SearchPanel/SearchPanel'
import ProfileMenu from '../../components/ProfileMenu/ProfileMenu'
import ListingImage from '../../components/ListingImage/ListingImage'
import { useListingFilters } from '../../hooks/useListingFilters'
import { getListings, formatPrice, conditionLabel, timeAgo } from '../../lib/listings'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

function Home() {
  const navigate = useNavigate()
  const { filters, update, clear, activeCount } = useListingFilters()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  // Filters start open on desktop, closed on phones so listings show first.
  const [categoriesOpen, setCategoriesOpen] = useState(() => window.matchMedia('(min-width: 701px)').matches)

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
    <div className={`home-page${categoriesOpen ? '' : ' search-panel-closed'}`}>
      <Sidebar categoriesOpen={categoriesOpen} onToggleCategories={() => setCategoriesOpen((open) => !open)} />

      <SearchPanel open={categoriesOpen} />

      <main className="home-main">
        <section className="home-heading">
          <div className="search-box marketplace-search">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Search items"
              placeholder="Search items..."
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
            />
          </div>

          {/* TODO: route to the Create Listing page once it exists */}
          <button type="button" className="sell-button">Sell Item</button>

          {/* TODO: pass the signed-in user's name from Supabase auth */}
          <ProfileMenu />
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
          {listings.map((item) => (
            <article
              className="listing-card"
              key={item.id}
              tabIndex={0}
              role="link"
              aria-label={`${item.title}, ${formatPrice(item.price)}`}
              onClick={() => navigate(`/ItemPage/${item.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/ItemPage/${item.id}`) }}
            >
              <div className="listing-left">
                <div
                  className="listing-image"
                  onClick={(e) => {
                    if (!item.images[0]) return
                    e.stopPropagation()
                    setSelectedImage(item.images[0])
                  }}
                >
                  <ListingImage src={item.images[0]} alt={item.title} category={item.category} />
                </div>
                <p className="listing-price">{formatPrice(item.price)}</p>
              </div>

              <div className="listing-right">
                <div className="listing-condition">
                  <span>Condition</span>
                  <strong>{conditionLabel(item.condition)}</strong>
                </div>

                <div className="listing-description">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>

                <p className="listing-meta">
                  📍 {item.meetupSpot} · {timeAgo(item.createdAt)}
                </p>
              </div>
            </article>
          ))}
        </section>

        {selectedImage && (
          <div className="image-modal" onClick={() => setSelectedImage(null)}>
            <img src={selectedImage} alt="Listing" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </main>
    </div>
  )
}

export default Home
