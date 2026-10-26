// The collapsible left panel (opened with the ☰ button) shared by Home and
// the Item Page: categories, condition, price range, and optionally search.
import { useState } from 'react'
import { CATEGORIES } from '../../data/categories'
import { CONDITIONS } from '../../data/conditions'
import { useListingFilters } from '../../hooks/useListingFilters'
import './SearchPanel.css'

function SearchPanel({ open, showSearch = false }) {
  const { filters, update, clear, activeCount } = useListingFilters()
  const [searchText, setSearchText] = useState(filters.q)

  function submitSearch(e) {
    e.preventDefault()
    update({ q: searchText.trim() })
  }

  return (
    <aside id="search-panel" className="search-panel" hidden={!open}>
      {showSearch && (
        <form className="search-box" role="search" onSubmit={submitSearch}>
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Search items"
            placeholder="Search items..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </form>
      )}

      <div className="filter-section">
        <div className="categories-heading">
          <h3>Categories</h3>
        </div>
        <div id="category-list" className="category-list">
          <button
            type="button"
            className={filters.category === '' ? 'active' : ''}
            aria-pressed={filters.category === ''}
            onClick={() => update({ category: '' })}
          >
            All items
          </button>
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.value}
              className={filters.category === c.value ? 'active' : ''}
              aria-pressed={filters.category === c.value}
              onClick={() => update({ category: c.value })}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="condition-filter">Condition</label>
        <select
          id="condition-filter"
          className="filter-select"
          value={filters.condition}
          onChange={(e) => update({ condition: e.target.value })}
        >
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label" id="price-label">Price</span>
        <div className="price-range" role="group" aria-labelledby="price-label">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Min"
            aria-label="Minimum price"
            value={filters.minPrice}
            onChange={(e) => update({ minPrice: e.target.value })}
          />
          <span aria-hidden="true">–</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Max"
            aria-label="Maximum price"
            value={filters.maxPrice}
            onChange={(e) => update({ maxPrice: e.target.value })}
          />
        </div>
      </div>

      {activeCount > 0 && (
        <button type="button" className="clear-filters" onClick={clear}>
          Clear filters ({activeCount})
        </button>
      )}
    </aside>
  )
}

export default SearchPanel
