import './ItemPage.css'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'

import examplePic from '../../assets/pencil.png'

function ItemPage() {
  const { id } = useParams()
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  // Placeholder Item
  const item = {
    name: `Item ${id}`,
    image: examplePic,
    price: '$10.00',
    condition: 'Good',
    description:
      'PLACEHOLDER DESCRIPTION.',
    category: 'Category 1',
    location: 'Anteatery',
    seller: 'Student1',
    date: '10/11/2026'
  }

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
      <main className="item-content">
        {/* Placeholder until item details are connected to the backend. */}
        <h1 className="item-name">{item.name}</h1>

        <div className="item-details">

          <div className="item-left">
            <div className="item-image-container">
              <img
                src={item.image}
                alt={item.name}
                className="item-image"
              />
            </div>

            <div className="additional-info">
              <h2>Additional Info</h2>

              <div className="info-row">
                <span className="info-label">Category</span>
                <span>{item.category}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Location</span>
                <span>{item.location}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Seller</span>
                <span>{item.seller}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Date Listed</span>
                <span>{item.date}</span>
              </div>


            </div>
          </div>

          <div className="item-right">
            <div className="item-card">
              <h2>Price</h2>
              <p className="item-price">{item.price}</p>
            </div>

            <div className="item-card">
              <h2>Condition</h2>
              <p className="item-condition">{item.condition}</p>
            </div>

            <div className="item-card description-card">
              <h2>Description</h2>
              <p>{item.description}</p>
            <button className="message-button">Message</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ItemPage