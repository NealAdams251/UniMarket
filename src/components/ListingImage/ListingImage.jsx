// Shows a listing photo, or a labeled placeholder when there's no photo yet.
import { categoryLabel } from '../../lib/listings'
import './ListingImage.css'

function ListingImage({ src, alt, category, className = '' }) {
  if (src) return <img src={src} alt={alt} className={className} />
  return (
    <div className={`listing-image-placeholder ${className}`} role="img" aria-label={`${alt} (no photo)`}>
      <span>{categoryLabel(category)}</span>
      <small>No photo yet</small>
    </div>
  )
}

export default ListingImage
