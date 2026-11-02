// The categories panel shared by Home and
// the Item Page: categories, condition, and price range.

import { Link } from 'react-router-dom'
import uciLogo from '../../assets/uci-logo.png'
import { CATEGORIES } from '../../data/categories'
import { CONDITIONS } from '../../data/conditions'
import { useListingFilters } from '../../hooks/useListingFilters'
import './SearchPanel.css'

function SearchPanel() {
  const { filters, update, clear, activeCount } = useListingFilters()
  return (
    <aside id="search-panel" className="search-panel">
      <div className="filter-section">
        <Link to="/" className="categories-home-logo" aria-label="UniMarket home" title="Return to homepage">
          <img src={uciLogo} alt="UCI" />
        </Link>
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
