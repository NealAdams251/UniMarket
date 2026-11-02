import './CreateListing.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar/Sidebar'

const CATEGORIES = [
  'Textbooks',
  'Furniture',
  'Electronics',
  'Clothing',
  'Dorm Essentials',
  'Others',
]

const CONDITIONS = [
  'New',
  'Like New',
  'Good',
  'Fair',
]

function CreateListing({ currentUser }) {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState('')
  const [description, setDescription] = useState('')
  const [meetupSpot, setMeetupSpot] = useState('')
  const [category, setCategory] = useState('')

  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function handleImageChange(e) {
    const file = e.target.files[0]

    if (!file) return

    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
  e.preventDefault()
  setErrorMessage('')

  if (!currentUser) {
    setErrorMessage('You must be logged in to create a listing.')
    return
  }

  if (
    !title.trim() ||
    !image ||
    !price ||
    !condition ||
    !description.trim() ||
    !meetupSpot.trim() ||
    !category
  ) {
    setErrorMessage('Please fill out all fields.')
    return
  }

  const numericPrice = Number(price)

  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    setErrorMessage('Please enter a valid price.')
    return
  }

  setLoading(true)

  try {
    // 1. Create listing first
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        seller_id: currentUser.uid,
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        category: category.toLowerCase(),
        condition: condition.toLocaleLowerCase(),
        meetup_spot: meetupSpot.trim(),
        status: 'active',
      })
      .select()
      .single()

    if (listingError) {
      throw listingError
    }

    // 2. Upload image
    const fileExtension = image.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExtension}`

    const storagePath =
      `${currentUser.uid}/${listing.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(storagePath, image)

    if (uploadError) {
      throw uploadError
    }

    // 3. Store image reference in listing_images table
    const { error: imageRowError } = await supabase
      .from('listing_images')
      .insert({
        listing_id: listing.id,
        storage_path: storagePath,
        sort_order: 0,
      })

    if (imageRowError) {
      throw imageRowError
    }

    console.log('Listing created:', listing)

    navigate('/')

  } catch (error) {
    console.error('Error creating listing:', error)
    setErrorMessage(
      error.message || 'Could not create listing.'
    )
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="create-listing-layout">

      <Sidebar />

      <main className="create-listing-page">
        <section className="create-listing-panel">

          <h1>Sell an Item</h1>

          <form
            className="create-listing-form"
            onSubmit={handleSubmit}
          >
            {/* Title */}
            <div className="form-group">
              <label htmlFor="listing-title">
                Title
              </label>

              <input
                id="listing-title"
                type="text"
                placeholder="Example: Mini Fridge"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Picture */}
            <div className="form-group">
              <label htmlFor="listing-image">
                Picture
              </label>

              <input
                id="listing-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />

              {imagePreview && (
                <img
                  className="listing-image-preview"
                  src={imagePreview}
                  alt="Listing preview"
                />
              )}
            </div>

            {/* Price */}
            <div className="form-group">
              <label htmlFor="listing-price">
                Price
              </label>

              <div className="price-input-wrapper">
                <span className="price-symbol">$</span>

                <input
                  id="listing-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Condition */}
            <div className="form-group">
              <label htmlFor="listing-condition">
                Condition
              </label>

              <select
                id="listing-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="">
                  Select condition
                </option>

                {CONDITIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="listing-category">
                Category
              </label>

              <select
                id="listing-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">
                  Select category
                </option>

                {CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="listing-description">
                Description
              </label>

              <textarea
                id="listing-description"
                rows="5"
                placeholder="Describe your item..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Meetup */}
            <div className="form-group">
              <label htmlFor="listing-meetup">
                Meetup Spot
              </label>

              <input
                id="listing-meetup"
                type="text"
                placeholder="Example: Student Center"
                value={meetupSpot}
                onChange={(e) => setMeetupSpot(e.target.value)}
              />
            </div>

            {errorMessage && (
              <p className="create-listing-error">
                {errorMessage}
              </p>
            )}

            <div className="create-listing-actions">
              <button
                type="button"
                className="cancel-listing-button"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-listing-button"
                disabled={loading}
              >
                {loading
                  ? 'Creating Listing...'
                  : 'Create Listing'}
              </button>
            </div>

          </form>
        </section>
      </main>

    </div>
  )
}

export default CreateListing