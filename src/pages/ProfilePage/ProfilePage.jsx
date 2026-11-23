import { profilePictureUrl } from '../../lib/profilePictures'
import './ProfilePage.css'
import ListingImage from '../../components/ListingImage/ListingImage'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getProfile, getListingsBySeller, formatPrice } from '../../lib/listings'
import { startConversation } from '../../lib/messages'
import {
    getFriendshipStatus,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    subscribeToFriendships,
} from '../../lib/friends'
import { useAuthUser } from '../../hooks/useAuthUser'
import Sidebar from '../../components/Sidebar/Sidebar'

function Profile() {
    const { uid } = useParams()
    const navigate = useNavigate()
    const { user: me } = useAuthUser()
    const [opening, setOpening] = useState(false)

    // Friend state with this profile: none | friends | incoming | outgoing
    const [friendship, setFriendship] = useState({ uid: null, status: 'none' })
    const [friendBusy, setFriendBusy] = useState(false)
    const friendStatus = friendship.uid === uid ? friendship.status : null

    useEffect(() => {
        if (!me || me.id === uid) return
        let ignore = false
        const load = () => getFriendshipStatus(me.id, uid)
            .then(status => { if (!ignore) setFriendship({ uid, status }) })
            .catch(err => console.error('Failed to load friendship:', err))
        load()
        const unsubscribe = subscribeToFriendships(load)
        return () => { ignore = true; unsubscribe() }
    }, [me, uid])

    async function changeFriendship(action) {
        if (!me) { navigate('/login'); return }
        setFriendBusy(true)
        try {
            await action(uid)
            setFriendship({ uid, status: await getFriendshipStatus(me.id, uid) })
        } catch (err) {
            console.error('Friend action failed:', err)
        } finally {
            setFriendBusy(false)
        }
    }

    async function messageUser() {
        if (!me) { navigate('/login'); return }
        setOpening(true)
        try {
            const conversationId = await startConversation(uid)
            navigate(`/messages/${conversationId}`)
        } catch (err) {
            console.error('Failed to start conversation:', err)
            setOpening(false)
        }
    }
 
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
            <Sidebar />
            <main className="profile-page">
                <div className="profile-card">
                    <div className="profile-top">
                        <div className="profile-avatar">
                            {user.avatarPath
                                ? <img src={profilePictureUrl(user.avatarPath)} alt="" />
                                : <span>{user.displayName?.charAt(0).toUpperCase()}</span>}
                        </div>
 
                    <div className="profile-main-info">
                        <h1>{user.displayName}</h1>
 
                        <p className="profile-school">
                            {user.school}
                        </p>
                    </div>

                    {me?.id !== uid && (
                        <div className="profile-actions">
                            {(!me || friendStatus === 'none') && (
                                <button type="button" className="profile-friend-button" disabled={friendBusy}
                                    onClick={() => changeFriendship(sendFriendRequest)}>
                                    Add friend
                                </button>
                            )}
                            {me && friendStatus === 'outgoing' && (
                                <button type="button" className="profile-friend-button" disabled={friendBusy}
                                    onClick={() => changeFriendship(removeFriend)} title="Cancel friend request">
                                    Request sent ✕
                                </button>
                            )}
                            {me && friendStatus === 'incoming' && (
                                <>
                                    <button type="button" className="profile-friend-button accept" disabled={friendBusy}
                                        onClick={() => changeFriendship(acceptFriendRequest)}>
                                        Accept request
                                    </button>
                                    <button type="button" className="profile-friend-button" disabled={friendBusy}
                                        onClick={() => changeFriendship(declineFriendRequest)}>
                                        Decline
                                    </button>
                                </>
                            )}
                            {me && friendStatus === 'friends' && (
                                <button type="button" className="profile-friend-button" disabled={friendBusy}
                                    onClick={() => {
                                        if (window.confirm(`Remove ${user.displayName} from your friends?`)) changeFriendship(removeFriend)
                                    }}
                                    title="Remove friend">
                                    ✓ Friends
                                </button>
                            )}
                            <button type="button" className="profile-message-button" onClick={messageUser} disabled={opening}>
                                {opening ? 'Opening…' : 'Message'}
                            </button>
                        </div>
                    )}
                </div>


            <div className="all-info">
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

            </div>

            
            </main>
        </div>
    )
}
 
export default Profile