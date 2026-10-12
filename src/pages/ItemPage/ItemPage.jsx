import './ItemPage.css'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'

function ItemPage() {
  const { id } = useParams()
  const [categoriesOpen, setCategoriesOpen] = useState(true)

  return (
    <div className={`item-page${categoriesOpen ? '' : ' search-panel-closed'}`}>
      <Sidebar categoriesOpen={categoriesOpen} onToggleCategories={() => setCategoriesOpen(open => !open)} />
      <aside id="search-panel" className="search-panel" hidden={!categoriesOpen}>
        <div className="search-box">
          <span className="search-icon">⌕</span>

          <input
            type="text"
            placeholder="Search items..."
          />
        </div>

        <div className="filter-section">
          <div className="categories-heading">
            <h3>Categories</h3>
          </div>
          <div id="category-list" className="category-list">
            <button>Category1</button>
            <button>Category2</button>
            <button>Category3</button>
            <button>Category4</button>
            <button>Category5</button>
          </div>
        </div>
      </aside>
      <main className="item-layout">
        {/* Placeholder until item details are connected to the backend. */}
        <h1 className="item-name">Item {id}</h1>
      </main>
    </div>
  )
}

export default ItemPage