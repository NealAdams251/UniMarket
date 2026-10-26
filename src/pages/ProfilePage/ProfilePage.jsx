import './ProfilePage.css'
import Sidebar from '../../components/Sidebar/Sidebar'
import { useParams } from 'react-router-dom'
import { placeholderUsers } from '../../data/placeholderUsers'
import { useState } from 'react'

function Profile() {
    const [categoriesOpen, setCategoriesOpen] = useState(true)
    const { uid } = useParams()
        console.log('uid:', uid)
    const user = placeholderUsers.find((user) => user.uid === uid)

    if (!user) {
        return (
        <div className="profile-layout">
            <Sidebar categoriesOpen={categoriesOpen} onToggleCategories={() => setCategoriesOpen(open => !open)} />

            <main className="profile-page">
            <div className="profile-card">
                <h2>User not found</h2>
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
                            {user.profileImage ? (
                                <img
                                src={user.profileImage}
                                alt={user.name}
                                />
                            ) : (
                                <span>
                                ##
                                </span>
                            )}
                        </div>

                    <div className="profile-main-info">
                        <h1>{user.name}</h1>

                        <p className="profile-school">
                            {user.school}
                        </p>
                    </div>
                </div>

                <div className="profile-details">
                    <div className="profile-detail">
                        <span className="detail-label">
                            Email
                        </span>

                        <span className="detail-value"> {user.email} </span>
                    </div>

                    <div className="profile-detail">
                        <span className="detail-label">
                            User ID
                        </span>

                        <span className="detail-value">
                            {user.uid}
                        </span>
                    </div>
                </div>

                <div className="profile-bio">
                    <h3>About</h3>
                    <p>{user.bio}</p>
                </div>

                <button className="product-history-button">
                    View Product History
                </button>
                </div>
            </main>
        </div>
    )
}

export default Profile