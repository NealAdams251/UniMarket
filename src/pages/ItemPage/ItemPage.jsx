import './ItemPage.css'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import SearchPanel from '../../components/SearchPanel/SearchPanel'
import ListingImage from '../../components/ListingImage/ListingImage'
import { getListing, formatPrice, conditionLabel, categoryLabel, timeAgo } from '../../lib/listings'

function ItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [item, setItem] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | missing | error
  const [activeImage, setActiveImage] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [messageSent, setMessageSent] = useState(false)

  useEffect(() => {
    let ignore = false
    setStatus('loading')
    setActiveImage(0)
    setMessageSent(false)
    getListing(id)
      .then((row) => {
        if (ignore) return
        setItem(row)
        setStatus(row ? 'ready' : 'missing')
      })
      .catch(() => { if (!ignore) setStatus('error') })
    return () => { ignore = true }
  }, [id])

  // Go back to the filtered results if the user came from Home; otherwise go Home.
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/'))

  return (
    <div className={`item-page${categoriesOpen ? '' : ' search-panel-closed'}`}>
      <Sidebar categoriesOpen={categoriesOpen} onToggleCategories={() => setCategoriesOpen((open) => !open)} />
      <SearchPanel open={categoriesOpen} showSearch />

      <main className="item-content">
        <button type="button" className="back-link" onClick={goBack}>← Back to listings</button>

        {status === 'loading' && <p className="item-status">Loading…</p>}
        {status === 'error' && <p className="item-status">Could not load this item. Try refreshing.</p>}
        {status === 'missing' && (
          <div className="item-status">
            <h1 className="item-name">Item not found</h1>
            <p>This listing may have been sold or removed.</p>
          </div>
        )}

        {status === 'ready' && (
          <>
            <h1 className="item-name">{item.title}</h1>

            <div className="item-details">
              <div className="item-left">
                <div
                  className={`item-image-container${item.images.length ? ' zoomable' : ''}`}
                  onClick={() => item.images.length && setZoomed(true)}
                >
                  <ListingImage
                    src={item.images[activeImage]}
                    alt={item.title}
                    category={item.category}
                    className="item-image"
                  />
                </div>

                {item.images.length > 1 && (
                  <div className="item-thumbnails">
                    {item.images.map((src, i) => (
                      <button
                        type="button"
                        key={src}
                        className={i === activeImage ? 'active' : ''}
                        aria-label={`Show photo ${i + 1}`}
                        onClick={() => setActiveImage(i)}
                      >
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="additional-info">
                  <h2>Additional Info</h2>
                  <div className="info-row">
                    <span className="info-label">Category</span>
                    <span>{categoryLabel(item.category)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Meetup spot</span>
                    <span>{item.meetupSpot}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Seller</span>
                    <span>{item.sellerId
                      ? <Link className="seller-link" to={`/profile/${item.sellerId}`}>{item.seller}</Link>
                      : item.seller}
                      {' '} <span className="verified-badge">✓ UCI verified</span></span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Date listed</span>
                    <span>{timeAgo(item.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="item-right">
                <div className="item-card">
                  <h2>Price</h2>
                  <p className="item-price">{formatPrice(item.price)}</p>
                </div>

                <div className="item-card">
                  <h2>Condition</h2>
                  <p className="item-condition">{conditionLabel(item.condition)}</p>
                </div>

                <div className="item-card description-card">
                  <h2>Description</h2>
                  <p>{item.description}</p>
                  {/* TODO: create a conversation in Supabase and open the chat page */}
                  <button
                    type="button"
                    className="message-button"
                    onClick={() => setMessageSent(true)}
                    disabled={messageSent}
                  >
                    {messageSent ? 'Chat coming soon' : `Message ${item.seller.split(' ')[0]}`}
                  </button>
                  <p className="safety-tip">Meet in a public spot on campus and check the item before paying.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {zoomed && (
          <div className="image-modal" onClick={() => setZoomed(false)}>
            <img src={item.images[activeImage]} alt={item.title} onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </main>
    </div>
  )
}

export default ItemPage
