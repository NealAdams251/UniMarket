import './ProfilePage.css'
import Sidebar from '../../components/Sidebar/Sidebar'
import ListingImage from '../../components/ListingImage/ListingImage'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getProfile, getListingsBySeller, formatPrice } from '../../lib/listings'

function Profile() {
    const [categoriesOpen, setCategoriesOpen] = useState(true)
    const { uid } = useParams()
 
    const [result, setResult] = useState({ uid: null, user: null, listings: [], failed: false })
 
    useEffect(() => {
        let ignore = false
        Promise.all([getProfile(uid), getListingsBySeller(uid)])
            .then(([user, listings]) => {
                if (!ignore) setResult({ uid, user, listings, failed: false })
            })
            .catch(err => {
                console.error('Failed to load profile:', err)
                if (!ignore) setResult({ uid, user: null, listings: [], failed: true })
            })
        return () => { ignore = true }
    }, [uid])
 
    const user = result.uid === uid ? result.user : null
    const listings = result.uid === uid ? result.listings : []
    const status =
        result.uid !== uid ? 'loading'
        : result.failed ? 'error'
        : user ? 'ready'
        : 'not-found'
 
    if (status !== 'ready') {
        const message = {
            'loading': 'Loading...',
            'not-found': 'User not found',
            'error': 'Could not load this profile',
        }[status]
 
        return (
        <div className="profile-layout">
            <Sidebar categoriesOpen={categoriesOpen} onToggleCategories={() => setCategoriesOpen(open => !open)} />
 
            <main className="profile-page">
            <div className="profile-card">
                <h2>{message}</h2>
            </div>
            </main>
        </div>
        )
    }

    return (
        <div className="profile-layout">
            <Sidebar categoriesOpen={categoriesOpen} onToggleCategories={() => setCategoriesOpen(open => !open)} />
 
            <main className="profile-page">
                <div className="profile-card">
                    <div className="profile-top">
                        <div className="profile-avatar">
                            <span>{user.displayName.charAt(0).toUpperCase()}</span>
                        </div>
 
                    <div className="profile-main-info">
                        <h1>{user.displayName}</h1>
 
                        <p className="profile-school">
                            {user.school}
                        </p>
                    </div>
                </div>
 
                <div className="profile-details">
                    <div className="profile-detail">
                        <span className="detail-label">
                            Member Since
                        </span>
 
                        <span className="detail-value">
                            {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                    </div>
 
                    <div className="profile-detail">
                        <span className="detail-label">
                            Active Listings
                        </span>
 
                        <span className="detail-value">
                            {listings.length}
                        </span>
                    </div>
                </div>
 
                <div className="profile-bio">
                    <h3>About</h3>
                    <p>{user.bio || 'This seller hasn\'t written a bio yet.'}</p>
                </div>
 
                <div className="profile-listings">
                    <h3>Listings</h3>
 
                    {listings.length === 0 && (
                        <p className="profile-listings-empty">No active listings.</p>
                    )}
 
                    <div className="profile-listings-grid">
                        {listings.map(item => (
                            <Link className="profile-listing" key={item.id} to={`/ItemPage/${item.id}`}>
                                <div className="profile-listing-image">
                                    <ListingImage src={item.images[0]} alt={item.title} category={item.category} />
                                </div>
                                <div className="profile-listing-info">
                                    <span className="profile-listing-name">{item.title}</span>
                                    <span className="profile-listing-price">{formatPrice(item.price)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                </div>
            </main>
        </div>
    )
}
 
export default Profile