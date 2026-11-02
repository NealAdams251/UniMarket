import './SearchItems.css'

function SearchItems({ value, onChange, onSubmit, showBrand = false }) {
  return (
    <form className="marketplace-search" role="search" onSubmit={onSubmit || ((event) => event.preventDefault())}>
      {showBrand && (
        <header className="search-brand">
          <h1>UNIMarket</h1>
          <p>One market for all your personal university needs</p>
        </header>
      )}
      <div className="search-box search-items-field">
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input type="search" aria-label="Search items" placeholder="Search items..."
        value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </form>
  )
}

export default SearchItems