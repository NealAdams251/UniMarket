import './Home.css'
import Sidebar from '../../components/Sidebar/Sidebar'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import examplePic from '../../assets/pencil.png'
import { placeholderUsers } from '../../data/placeholderUsers'
import { categories } from '../../data/categories'


const items = [
  {
    id: 1,
    name: 'Item 1',
    price: 10,
    category: 'School Supplies',
    listedAt: '2026-10-15',
    condition: 'Good',
    description: '23 giant frogs',
    image: examplePic,
  },
  {
    id: 2,
    name: 'Item 2',
    price: 15,
    category: 'Electronics',
    listedAt: '2026-10-12',
    condition: 'Like New',
    description: 'a laptop with no screen',
    image: '',
  },
  {
    id: 3,
    name: 'Item 3',
    price: 35,
    category: 'Textbooks',
    listedAt: '2026-10-16',
    condition: 'Good',
    description: 'ics 32 homework',
    image: '',
  },
  {
    id: 4,
    name: 'Item 4',
    price: 40,
    category: 'Electronics',
    listedAt: '2026-10-10',
    condition: 'Fair',
    description: 'iphone13',
    image: '',
  },
]

function Home({ currentUser, setCurrentUser }) {
  const navigate = useNavigate()
  const [selectedImage, setSelectedImage] = useState(null)
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  const query = search.trim().toLowerCase()
  const visibleItems = items
    .filter(item => !selectedCategory || item.category === selectedCategory)
    .filter(item => minPrice === '' || item.price >= Number(minPrice))
    .filter(item => maxPrice === '' || item.price <= Number(maxPrice))
    .filter(item => !query || `${item.name} ${item.description}`.toLowerCase().includes(query))
    .sort((a, b) => {
      if (sortBy === 'price-desc') return b.price - a.price
      if (sortBy === 'price-asc') return a.price - b.price
      return new Date(b.listedAt) - new Date(a.listedAt)
    })

  return (
    <div className={`home-page${categoriesOpen ? '' : ' search-panel-closed'}`}>
      <Sidebar categoriesOpen={categoriesOpen} onToggleCategories={() => setCategoriesOpen(open => !open)} />
      
      <aside id="search-panel" className="search-panel" hidden={!categoriesOpen}>
        

        <div className="filter-section">
          <div className="categories-heading">
            <h3>Categories</h3>
          </div>
          <div id="category-list" className="category-list">
            <button
              className={selectedCategory === null ? 'active' : ''}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={selectedCategory === category ? 'active' : ''}
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Price</h3>
          <div className="price-range">
            <input
              type="number" min="0" placeholder="Min" aria-label="Minimum price"
              value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
            />
            <span>–</span>
            <input
              type="number" min="0" placeholder="Max" aria-label="Maximum price"
              value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-section">
          <h3>Sort By</h3>
          <button className={sortBy === 'recent' ? 'active' : ''} onClick={() => setSortBy('recent')}>
            Most Recent
          </button>
          <button className={sortBy === 'price-desc' ? 'active' : ''} onClick={() => setSortBy('price-desc')}>
            Price: High to Low
          </button>
          <button className={sortBy === 'price-asc' ? 'active' : ''} onClick={() => setSortBy('price-asc')}>
            Price: Low to High
          </button>
        </div>
      </aside>

      <main className="home-main">

        <section className="home-heading">
          <div className="search-box marketplace-search">
            <span className="search-icon">⌕</span>

            <input
              type="search" aria-label="Search items"
              placeholder="Search items..."
              value={search} onChange={(e) => setSearch(e.target.value)}
            />

          </div>

        <div className="header-buttons">
          {currentUser ? (
            <>
            <button className="sell-button"> Sell Item </button>

            <div className="profile-menu">
              <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)}>
                <span className="profile-icon">##</span>

                <div className="profile-text">
                  <span className="profile-name">{currentUser.name}</span>
                </div>
              </button>

                {profileOpen && (
                  <div className="profile-dropdown">
                    <button onClick={() => navigate(`/profile/${currentUser.uid}`)}>
                      View Profile
                    </button>

                    <button onClick={() => navigate('/settings')}>
                      Settings
                    </button>

                    <button className="logout-button" onClick={() => {
                        setCurrentUser(null)
                        setProfileOpen(false)}}>
                      Log Out
                    </button>
                  </div>
                )}
              </div>

            </>
            ) : (
              <div className="signup-buttons">
                <button className="login-button" onClick={() => navigate('/signup')}>Sign Up</button>
                <button className="login-button" onClick={() => navigate('/login')}>Log In</button>
              </div>
            )}
          </div>

        </section>

        <section className="items-list">
        {visibleItems.length === 0 && (
          <p className="no-results">No items match your filters.</p>
        )}

        {visibleItems.map((item) => (
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