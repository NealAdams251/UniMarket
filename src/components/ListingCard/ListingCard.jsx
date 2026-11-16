// Uniform marketplace card: square photo, condition pill, price, title, meetup spot.
import { useNavigate } from 'react-router-dom'
import ListingImage from '../ListingImage/ListingImage'
import { formatPrice, conditionLabel, timeAgo } from '../../lib/listings'
import './ListingCard.css'

function ListingCard({ item }) {
  const navigate = useNavigate()
  const price = formatPrice(item.price)
  const open = () => navigate(`/ItemPage/${item.id}`)

  return (
    <article
      className="listing-card"
      tabIndex={0}
      role="link"
      aria-label={`${item.title}, ${price}`}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter') open() }}
    >
      <div className="listing-card-media">
        <ListingImage src={item.images[0]} alt={item.title} category={item.category} />
        {item.condition && (
          <span className={`listing-card-condition condition-${item.condition}`}>
            <span className="listing-card-dot" aria-hidden="true" />
            {conditionLabel(item.condition)}
          </span>
        )}
      </div>

      <div className="listing-card-body">
        <p className={`listing-card-price${price === 'Free' ? ' is-free' : ''}`}>{price}</p>
        <h3 className="listing-card-title">{item.title}</h3>
        <p className="listing-card-meta">
          <svg className="listing-card-pin" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          <span className="listing-card-spot">{item.meetupSpot}</span>
          <span className="listing-card-date">{timeAgo(item.createdAt)}</span>
        </p>
      </div>
    </article>
  )
}

export default ListingCard
