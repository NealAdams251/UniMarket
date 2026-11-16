import './CreateListing.css'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { CONDITIONS } from '../../data/conditions'
import { CATEGORIES } from '../../data/categories'
import Sidebar from '../../components/Sidebar/Sidebar'

// Used for both "Sell an Item" (/CreateListing) and editing (/EditListing/:id).
function CreateListing({ currentUser }) {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const isEditing = Boolean(editId)

  const [title, setTitle] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState('')
  const [description, setDescription] = useState('')
  const [meetupSpot, setMeetupSpot] = useState('')
  const [category, setCategory] = useState('')
  const [existingImages, setExistingImages] = useState([])

  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingListing, setLoadingListing] = useState(isEditing)

  // In edit mode, load the listing and fill in the form.
  useEffect(() => {
    if (!isEditing || !currentUser) return
    let ignore = false

    supabase
      .from('listings')
      .select('*, listing_images (storage_path, sort_order)')
      .eq('id', editId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (ignore) return
        if (error || !data) {
          setErrorMessage('Could not load this listing.')
        } else if (data.seller_id !== currentUser.uid) {
          setErrorMessage('You can only edit your own listings.')
        } else {
          const images = [...(data.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)
          setTitle(data.title ?? '')
          setPrice(data.price ?? '')
          setCondition(data.condition ?? '')
          setCategory(data.category ?? '')
          setDescription(data.description ?? '')
          setMeetupSpot(data.meetup_spot ?? '')
          setExistingImages(images)
          if (images[0]) {
            setImagePreview(
              supabase.storage.from('listing-images').getPublicUrl(images[0].storage_path).data.publicUrl
            )
          }
        }
        setLoadingListing(false)
      })

    return () => { ignore = true }
  }, [isEditing, editId, currentUser])

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

  // A new photo is optional when editing (the current one is kept).
  const hasImage = image || (isEditing && existingImages.length > 0)

  if (
    !title.trim() ||
    !hasImage ||
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

  const fields = {
    title: title.trim(),
    description: description.trim(),
    price: numericPrice,
    category,
    condition,
    meetup_spot: meetupSpot.trim(),
  }

  try {
    let listing

    if (isEditing) {
      // 1. Update the listing (only the seller's own row)
      const { data, error: updateError } = await supabase
        .from('listings')
        .update(fields)
        .eq('id', editId)
        .eq('seller_id', currentUser.uid)
        .select()

      if (updateError) {
        throw updateError
      }

      // Supabase returns no rows (instead of an error) when a policy blocks the update.
      if (!data?.length) {
        throw new Error('Could not save changes. You may not have permission to edit this listing.')
      }

      listing = data[0]
    } else {
      // 1. Create listing first
      const { data, error: listingError } = await supabase
        .from('listings')
        .insert({
          ...fields,
          seller_id: currentUser.uid,
          status: 'active',
        })
        .select()
        .single()

      if (listingError) {
        throw listingError
      }

      listing = data
    }

    if (image) {
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

      // 3. When editing, remove the old photo(s) before saving the new one
      if (isEditing && existingImages.length > 0) {
        const { error: oldRowsError } = await supabase
          .from('listing_images')
          .delete()
          .eq('listing_id', listing.id)

        if (oldRowsError) {
          throw oldRowsError
        }

        await supabase.storage
          .from('listing-images')
          .remove(existingImages.map((img) => img.storage_path))
      }

      // 4. Store image reference in listing_images table
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
    }

    navigate(isEditing ? `/MyListings/${currentUser.uid}` : '/')

  } catch (error) {
    console.error(isEditing ? 'Error updating listing:' : 'Error creating listing:', error)
    setErrorMessage(
      error.message || (isEditing ? 'Could not save changes.' : 'Could not create listing.')
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

          <h1>{isEditing ? 'Edit Listing' : 'Sell an Item'}</h1>

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
                <option value="">Select condition</option>

                {CONDITIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                    {item.label}
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                >
                <option value="">Select category</option>

                {CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                    {item.label}
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
                onClick={() => navigate(isEditing && currentUser ? `/MyListings/${currentUser.uid}` : '/')}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-listing-button"
                disabled={loading || loadingListing}
              >
                {loading
                  ? (isEditing ? 'Saving...' : 'Creating Listing...')
                  : (isEditing ? 'Save Changes' : 'Create Listing')}
              </button>
            </div>

          </form>
        </section>
      </main>

    </div>
  )
}

export default CreateListing