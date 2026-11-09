import './MyListings.css'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar/Sidebar'
import { CONDITIONS } from '../../data/conditions'

function ListingMenu({ listingId, onDelete, currentUser, setCurrentUser }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleOutsideClick(e) {
      if (!wrapperRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
    }
  }, [])

  return (
    <div className="listing-menu" ref={wrapperRef}>
        <button
			type="button"
			className="listing-menu-button"
			onClick={(e) => {
				e.stopPropagation()
				setOpen((prev) => !prev)
			}}
			aria-label="Listing options"
    	>
        ⋯
      </button>

      {open && (
        <div className="listing-menu-dropdown">
          <button
            type="button"
            className="delete-listing-button"
            onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onDelete(listingId)
            }}
          >
            Delete listing
          </button>
        </div>
      )}
    </div>
  )
}

function getConditionLabel(value) {
  return CONDITIONS.find(
    (condition) => condition.value === value
  )?.label || value
}

function MyListings({ currentUser }) {
  const navigate = useNavigate()

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    fetchListings()
  }, [currentUser])

  async function fetchListings() {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        listing_images (
          id,
          storage_path,
          sort_order
        )
      `)
      .eq('seller_id', currentUser.uid)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setErrorMessage('Could not load your listings.')
      setLoading(false)
      return
    }

    setListings(data || [])
    setLoading(false)
  }

  function getListingImage(listing) {
    const images = listing.listing_images || []

    if (images.length === 0) {
      return null
    }

    const sortedImages = [...images].sort(
      (a, b) => a.sort_order - b.sort_order
    )

    const { data } = supabase.storage
      .from('listing-images')
      .getPublicUrl(sortedImages[0].storage_path)

    return data.publicUrl
  }

  async function handleDelete(listingId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this listing?'
    )

    if (!confirmed) return

    try {
      // Get image paths first
      const { data: images, error: imageFetchError } = await supabase
        .from('listing_images')
        .select('storage_path')
        .eq('listing_id', listingId)

      if (imageFetchError) {
        throw imageFetchError
      }

      // Delete images from Storage
      if (images?.length > 0) {
        const paths = images.map((image) => image.storage_path)

        const { error: storageError } = await supabase.storage
          .from('listing-images')
          .remove(paths)

        if (storageError) {
          throw storageError
        }
      }

      // Delete image database rows
      const { error: imageRowError } = await supabase
        .from('listing_images')
        .delete()
        .eq('listing_id', listingId)

      if (imageRowError) {
        throw imageRowError
      }

      // Delete listing
      const { error: listingError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)

      if (listingError) {
        throw listingError
      }

      // Remove from UI immediately
      setListings((prev) =>
        prev.filter((listing) => listing.id !== listingId)
      )
    } catch (error) {
      console.error('Delete error:', error)
      setErrorMessage(error.message)
    }
  }

  if (!currentUser) {
    return (
      <div className="my-listings-layout">
        <Sidebar />

        <main className="my-listings-page">
          <h1>My Listings</h1>
          <p>You need to be logged in to view your listings.</p>

          <button onClick={() => navigate('/login')}>
            Log In
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="my-listings-layout">
      <Sidebar />

      <main className="my-listings-page">
        <div className="my-listings-header">
          <h1>My Listings</h1>

          <button
            className="create-new-listing-button"
            onClick={() => navigate('/CreateListing')}
          >
            Create Listing
          </button>
        </div>

        {errorMessage && (
          <p className="my-listings-error">
            {errorMessage}
          </p>
        )}

        {loading ? (
          <p>Loading listings...</p>
        ) : listings.length === 0 ? (
          <div className="no-listings">
            <h2>No listings yet</h2>
            <p>Create your first listing to start selling.</p>

            <button onClick={() => navigate('/sell')}>
              Sell an Item
            </button>
          </div>
        ) : (
          <div className="my-listings-grid">
            {listings.map((listing) => {
              const imageUrl = getListingImage(listing)

              return (
                <article
                    className="my-listing-card"
                    key={listing.id}
                    onClick={() => navigate(`/ItemPage/${listing.id}`)}
                >
                  <div className="listing-image-container">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={listing.title}
                        className="my-listing-image"
                      />
                    ) : (
                      <div className="listing-image-placeholder">
                        No Image
                      </div>
                    )}

                    <ListingMenu
                      listingId={listing.id}
                      onDelete={handleDelete}
                    />
                  </div>

                  <div className="my-listing-info">
                    <h2>{listing.title}</h2>

                    <p className="my-listing-price">
                      ${Number(listing.price).toFixed(2)}
                    </p>

                    <p className="my-listing-condition">
                      {getConditionLabel(listing.condition)}
                    </p>

                    <p className="my-listing-status">
                      {listing.status}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default MyListings