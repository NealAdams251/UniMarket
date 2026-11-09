import { PROFILE_PICTURES_BUCKET, profilePictureUrl } from '../../lib/profilePictures'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getProfile } from '../../lib/listings'
import './Settings.css'

function Settings({ setCurrentUser, darkMode, setDarkMode }) {
  const [auth, setAuth] = useState({ loading: true, user: null })
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const [tab, setTab] = useState('Account')
  const [profileResult, setProfileResult] = useState(null)
  const userId = auth.user?.id

  useEffect(() => {
    let active = true
    let authChanged = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authChanged = true
      if (active) setAuth({ loading: false, user: session?.user ?? null })
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && !authChanged) setAuth({ loading: false, user: error ? null : data.session?.user ?? null })
    }).catch(() => {
      if (active && !authChanged) setAuth({ loading: false, user: null })
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (tab !== 'Profile' || !userId) return
    let active = true
    getProfile(userId)
      .then(profile => { if (active) setProfileResult({ userId, profile }) })
      .catch(() => { if (active) setProfileResult({ userId, failed: true }) })
    return () => { active = false }
  }, [tab, userId])

  function updateProfile(field, value) {
    setProfileResult(result => ({ ...result, profile: { ...result.profile, [field]: value } }))
    if (field === 'avatarPath') return
    const userField = field === 'displayName' ? 'name' : field
    setCurrentUser(user => user?.uid === userId ? { ...user, [userField]: value } : user)
  }

  async function signOut() {
    setSigningOut(true)
    setError('')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setCurrentUser(null)
      setAuth({ loading: false, user: null })
    } catch {
      setError('Could not sign out. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }

  if (auth.loading) return <main className="settings-page"><p role="status">Loading settings…</p></main>
  if (!auth.user) return <Navigate to="/login" replace />

  return (
    <main className="settings-page">
      <Link className="settings-home" to="/">← Back to home</Link>
      <div className="settings-content">
        <h1>Settings</h1>
        <div className="settings-tabs" role="group" aria-label="Settings tabs">
          {['Account', 'Profile'].map(label => (
            <button key={label} type="button" aria-pressed={tab === label}
              onClick={() => setTab(label)}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'Account' ? (
          <>
            <section className="settings-section settings-account" aria-label="Account">
              <dl><dt>Email</dt><dd>{auth.user.email}</dd></dl>
              <label className="settings-theme">
                <input type="checkbox" role="switch" checked={darkMode}
                  onChange={event => setDarkMode(event.target.checked)} />
                Dark mode
              </label>
            </section>
            <section className="settings-section" aria-label="Sign out">
              <button type="button" onClick={signOut} disabled={signingOut}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
              {error && <p role="alert">{error}</p>}
            </section>
          </>
        ) : (
          <section className="settings-section settings-account" aria-label="Profile">
            {profileResult?.userId !== userId ? <p role="status">Loading profile…</p>
              : profileResult.failed ? <p role="alert">Could not load your profile.</p>
              : profileResult.profile ? (
                <dl className="settings-profile-details">
                  <dt>Display name</dt><dd><ProfileEditor userId={userId} label="Display name" column="display_name" value={profileResult.profile.displayName} limit={32} onSave={value => updateProfile('displayName', value)} /></dd>
                  <dt>Profile picture</dt>
                  <dd><ProfilePictureUpload userId={userId} path={profileResult.profile.avatarPath}
                    onSave={path => updateProfile('avatarPath', path)} /></dd>
                  <dt>School</dt><dd>{profileResult.profile.school || 'Not set'}</dd>
                  <dt>Bio</dt><dd><ProfileEditor userId={userId} label="Bio" column="bio" value={profileResult.profile.bio} limit={256} onSave={value => updateProfile('bio', value)} /></dd>
                </dl>
              ) : <p>No profile found.</p>}
          </section>
        )}
      </div>
    </main>
  )
}

function ProfilePictureUpload({ userId, path, onSave }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || uploading) return

    setError('')
    const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
    const extension = extensions[file.type]
    if (!extension || file.size > 5 * 1024 * 1024 || file.size === 0) {
      setError('Choose a JPEG, PNG, WebP, or GIF image up to 5 MB.')
      return
    }

    setUploading(true)
    const storage = supabase.storage.from(PROFILE_PICTURES_BUCKET)
    const newPath = userId + '/' + crypto.randomUUID() + '.' + extension
    try {
      const { error: uploadError } = await storage.upload(newPath, file)
      if (uploadError) throw uploadError
      const { error: updateError } = await supabase.from('profiles')
        .update({ avatar_path: newPath }).eq('id', userId).select('id').single()
      if (updateError) {
        await storage.remove([newPath])
        throw updateError
      }
      onSave(newPath)
      if (path) await storage.remove([path])
    } catch {
      setError('Could not upload your profile picture. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="settings-picture">
      {path && <img src={profilePictureUrl(path)} alt="Current profile picture" />}
      <label className="settings-upload">
        {uploading ? 'Uploading…' : 'Upload image'}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={upload} disabled={uploading} />
      </label>
      {error && <p className="profile-save-error" role="alert">{error}</p>}
    </div>
  )
}

function ProfileEditor({ userId, label, column, value, limit, onSave }) {
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const limitError = 'Exceeded the max character limit of ' + limit
  const tooLong = error === limitError
  const errorId = 'settings-' + column + '-error'

  async function save(event) {
    event.preventDefault()
    if (saving) return
    if ([...draft].length > limit) {
      setError(limitError)
      return
    }

    setSaving(true)
    setError('')
    try {
      const { data, error } = await supabase.from('profiles')
        .update({ [column]: draft })
        .eq('id', userId)
        .select(column)
        .single()
      if (error) throw error
      onSave(data[column])
      setDraft(null)
    } catch {
      setError('Could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (draft === null) {
    return (
      <button type="button" className="profile-edit-value" aria-label={'Edit ' + label}
        onClick={() => setDraft(value ?? '')}>
        {value || 'Not set'}
      </button>
    )
  }

  return (
    <form className="profile-editor" onSubmit={save}>
      <textarea autoFocus aria-label={label} value={draft} disabled={saving}
        aria-invalid={tooLong} aria-describedby={error ? errorId : undefined}
        onChange={event => {
          setDraft(event.target.value)
          setError('')
        }} />
      {error && <p id={errorId} className={tooLong ? 'profile-limit-error' : 'profile-save-error'} role="alert">{error}</p>}
      <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
    </form>
  )
}

export default Settings