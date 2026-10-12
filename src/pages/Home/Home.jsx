import './Home.css'
import Sidebar from '../../components/Sidebar/Sidebar'
import ItemPage from '../ItemPage/ItemPage'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import examplePic from '../../assets/pencil.png'


const items = [
  {
    id: 1,
    name: 'Item 1',
    price: 10,
    condition: 'Good',
    description: '23 giant frogs',
    image: examplePic,
  },
  {
    id: 2,
    name: 'Item 2',
    price: 15,
    condition: 'Like New',
    description: 'a laptop with no screen',
    image: '',
  },
  {
    id: 3,
    name: 'Item 3',
    price: 35,
    condition: 'Good',
    description: 'ics 32 homework',
    image: '',
  },
  {
    id: 4,
    name: 'Item 4',
    price: 40,
    condition: 'Fair',
    description: 'iphone13',
    image: '',
  },
]

function Home() {
  const navigate = useNavigate()
  const [selectedImage, setSelectedImage] = useState(null)
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  return (
    <div className={`home-page${categoriesOpen ? '' : ' search-panel-closed'}`}>
      <Sidebar categoriesOpen={categoriesOpen} onToggleCategories={() => setCategoriesOpen(open => !open)} />
      
      <aside id="search-panel" className="search-panel" hidden={!categoriesOpen}>
        

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

      <main className="home-main">

          

        <section className="home-heading">
          <div className="search-box marketplace-search">
          <span className="search-icon">⌕</span>

          <input
            type="search" aria-label="Search items"
            placeholder="Search items..."
          />
        </div>
          <div>
            <h2>UCI Marketplace</h2>
            <p>Find what's near you.</p>
          </div>

          <button className="sell-button">
            Sell Item
          </button>
          <button className="profile-button">
            <span className="profile-icon">##</span>

            <div className="profile-text">
              <span className="profile-name">Name</span>
            </div>
          </button>
        </section>

        <section className="items-list">
        {items.map((item) => (
            <article className="listing-card" key={item.id} onClick={() => navigate(`/ItemPage/${item.id}`)}>
                <div className="listing-left">
                    <div className="listing-image" onClick={(e) => { e.stopPropagation() 
                      setSelectedImage(item.image)}}>

                    <img src={item.image} alt={item.name} />
                    </div>

                    <p className="listing-price">
                    ${item.price}
                    </p>
                </div>

                <div className="listing-right">
                    <div className="listing-condition">
                    <span>Condition</span>
                    <strong>{item.condition}</strong>
                    </div>

                    <div className="listing-description">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    </div>
                </div>
            </article>
        ))}

        {selectedImage && (
          <div
            className="image-modal"
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={selectedImage}
              alt="Listing"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        </section>
      </main>
    </div>
  )
}

export default Home