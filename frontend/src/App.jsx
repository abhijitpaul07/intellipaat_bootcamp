import { useCallback, useEffect, useMemo, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://intellipaat-bootcamp.onrender.com').replace(/\/$/, '')
const ROLES = [
  { value: 'student', label: 'Students' },
  { value: 'admin', label: 'Admin' },
  { value: 'organizer', label: 'Organizer' },
]

async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options)
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`)
  return data
}

function initials(title = 'Event') {
  return title.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
}

function App() {
  const [events, setEvents] = useState([])
  const [selected, setSelected] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [role, setRole] = useState('student')
  const [roleUsers, setRoleUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api('/api/events')
      setEvents(Array.isArray(data) ? data : [])
      setNotice(null)
    } catch (error) {
      setNotice({ type: 'error', text: `Could not load events: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  useEffect(() => {
    let active = true
    setUsersLoading(true)
    setRoleUsers([])
    setSelectedUserId('')
    api(`/api/users?role=${encodeURIComponent(role)}`)
      .then((data) => {
        if (!active) return
        const users = Array.isArray(data) ? data : []
        setRoleUsers(users)
        setSelectedUserId(users[0]?.id || '')
      })
      .catch((error) => {
        if (active) setNotice({ type: 'error', text: `Could not load ${role} IDs: ${error.message}` })
      })
      .finally(() => { if (active) setUsersLoading(false) })
    return () => { active = false }
  }, [role])

  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return events
    return events.filter((event) => `${event.title || ''} ${event.status || ''}`.toLowerCase().includes(normalized))
  }, [events, query])

  async function chooseEvent(event) {
    setSelected(event)
    setAttendees([])
    setNotice(null)
    try {
      const [details, people] = await Promise.all([
        api(`/api/events/${encodeURIComponent(event.id)}`),
        api(`/api/events/${encodeURIComponent(event.id)}/registrations`),
      ])
      setSelected(details)
      setAttendees(Array.isArray(people) ? people : [])
    } catch (error) {
      setNotice({ type: 'error', text: `Could not load event details: ${error.message}` })
    }
  }

  async function register(event) {
    event.preventDefault()
    if (!selected || !selectedUserId) return
    setBusy(true)
    setNotice(null)
    try {
      await api('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUserId, event_id: selected.id }),
      })
      const eventId = encodeURIComponent(selected.id)
      const [details, people] = await Promise.all([
        api(`/api/events/${eventId}`),
        api(`/api/events/${eventId}/registrations`),
      ])
      setSelected(details)
      setAttendees(Array.isArray(people) ? people : [])
      setNotice({ type: 'success', text: `You’re registered for ${details.title}.` })
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  async function findRegistrations(event) {
    event.preventDefault()
    if (!selectedUserId) return
    setBusy(true)
    setNotice(null)
    try {
      const data = await api(`/api/me/registrations?user_id=${encodeURIComponent(selectedUserId)}`)
      setRegistrations(Array.isArray(data) ? data : [])
      setNotice({ type: 'success', text: `Found ${data.length} registration${data.length === 1 ? '' : 's'}.` })
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Gather home"><span className="brand-mark">g</span><span>gather<span className="brand-period">.</span></span></a>
        <nav className="top-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#events">Explore</a>
          <a className="nav-link" href="#my-registrations">My registrations</a>
        </nav>
        <a className="top-cta" href="#events">Find your next event <span aria-hidden="true">↗</span></a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> GOOD THINGS HAPPEN TOGETHER</div>
            <h1>Make room for<br /><em>something good.</em></h1>
            <p className="hero-text">A little curiosity can take you a long way. Find a room full of people who are into the same things you are.</p>
            <a href="#events" className="hero-button">Explore events <span aria-hidden="true">↓</span></a>
            <div className="hero-note"><span className="note-line" /> Your people are out there. Go find them.</div>
          </div>
          <div className="hero-art" aria-label="Illustration of people gathering">
            <div className="art-sun" />
            <div className="art-label label-top">GOOD ENERGY ONLY <span>✳</span></div>
            <div className="art-circle circle-one" /><div className="art-circle circle-two" />
            <div className="art-person person-one"><span className="person-head" /><span className="person-body" /></div>
            <div className="art-person person-two"><span className="person-head" /><span className="person-body" /></div>
            <div className="art-person person-three"><span className="person-head" /><span className="person-body" /></div>
            <div className="art-person person-four"><span className="person-head" /><span className="person-body" /></div>
            <div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✦</div>
            <div className="art-caption">BETTER IN<br />GOOD COMPANY</div>
            <div className="art-label label-bottom">COME AS YOU ARE <span>↗</span></div>
          </div>
        </section>

        <section className="profile-selector" aria-label="Choose a user profile">
          <div className="profile-selector-copy"><div className="eyebrow">PICK A PROFILE</div><h2>Who are you here as?</h2><p>Choose a role to load the matching user IDs.</p></div>
          <div className="profile-selectors">
            <label>ROLE<select value={role} onChange={(event) => setRole(event.target.value)}>{ROLES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
            <label>USER ID<select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} disabled={usersLoading || roleUsers.length === 0}><option value="">{usersLoading ? 'Loading IDs…' : roleUsers.length ? 'Select an ID' : 'No IDs for this role'}</option>{roleUsers.map((user) => <option value={user.id} key={user.id}>{user.id}{user.email ? ` · ${user.email}` : ''}</option>)}</select></label>
          </div>
        </section>

        {notice && <div className={`notice ${notice.type}`} role="status"><span>{notice.type === 'error' ? '!' : '✓'}</span>{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss message">×</button></div>}

        <section className="events-section" id="events">
          <div className="section-heading">
            <div><div className="eyebrow section-eyebrow">YOUR NEXT CHAPTER STARTS HERE</div><h2>Find your kind of <em>thing.</em></h2></div>
            <div className="section-count">{events.length.toString().padStart(2, '0')} <span>events to explore</span></div>
          </div>
          <div className="event-toolbar">
            <div className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events or status" aria-label="Search events" /><kbd>⌘ K</kbd></div>
            <button className="refresh-button" onClick={loadEvents} disabled={loading}><span className={loading ? 'refresh-spin' : ''}>↻</span> Refresh</button>
          </div>

          {loading ? <div className="loading-state"><span className="loader" />Finding the good stuff…</div> : filteredEvents.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">✳</span><h3>{events.length ? 'Nothing by that name yet.' : 'The room is getting ready.'}</h3><p>{events.length ? 'Try another search.' : 'Check back soon for events to explore.'}</p></div>
          ) : (
            <div className="event-layout">
              <div className="event-grid">
                {filteredEvents.map((event, index) => <button className={`event-card ${selected?.id === event.id ? 'selected' : ''}`} key={event.id} onClick={() => chooseEvent(event)}>
                  <div className={`event-card-art art-${index % 4}`}><span className="event-monogram">{initials(event.title)}</span><span className="event-art-spark">✳</span><span className="card-index">NO. {(index + 1).toString().padStart(2, '0')}</span></div>
                  <div className="event-card-content"><div className="event-meta"><span className="status-dot" />{event.status || 'Event'}<span className="event-arrow">↗</span></div><h3>{event.title || 'Untitled event'}</h3><div className="event-card-footer"><span>Capacity</span><strong>{event.capacity ?? 'Open'}</strong></div></div>
                </button>)}
              </div>

              {selected && <aside className="detail-panel" aria-live="polite">
                <button className="detail-close" onClick={() => { setSelected(null); setAttendees([]) }} aria-label="Close event details">×</button>
                <div className="eyebrow">A SEAT AT THE TABLE</div>
                <div className="detail-monogram">{initials(selected.title)}</div>
                <h3>{selected.title}</h3>
                <p className="detail-status"><span className="status-dot" />{selected.status || 'Details'}</p>
                <div className="detail-facts"><div><span>CAPACITY</span><strong>{selected.capacity ?? 'Open'}</strong></div><div><span>REGISTERED</span><strong>{attendees.length}</strong></div></div>
                <form className="register-form" onSubmit={register}><p className="register-as">Registering as <strong>{ROLES.find((item) => item.value === role)?.label}</strong>{selectedUserId ? ` · ${selectedUserId}` : ''}</p><button className="submit-button" type="submit" disabled={busy || usersLoading || !selectedUserId}>{busy ? 'Working…' : 'Save my spot'} <span>↗</span></button></form>
                <div className="attendee-list"><div className="attendee-heading"><span>WHO’S COMING</span><span>{attendees.length}</span></div>{attendees.length ? attendees.slice(0, 4).map((item) => <div className="attendee" key={item.id}><span className="attendee-avatar">{(item.users?.email || 'G')[0].toUpperCase()}</span><span>{item.users?.email || 'Guest'}</span></div>) : <p className="no-attendees">Be the first to join.</p>}</div>
              </aside>}
            </div>
          )}
        </section>

        <section className="my-section" id="my-registrations">
          <div className="my-copy"><div className="eyebrow">KEEP YOUR PLANS CLOSE</div><h2>Already found<br />your <em>people?</em></h2><p>Look up the events you’ve saved with your user ID.</p></div>
          <div className="lookup-card"><div className="lookup-icon">↗</div><h3>Your plans, all in one place.</h3><p>Using the selected {ROLES.find((item) => item.value === role)?.label.toLowerCase()} profile.</p><form className="lookup-form" onSubmit={findRegistrations}><button disabled={busy || usersLoading || !selectedUserId}>{busy ? 'Loading…' : 'Find registrations'}</button></form>
            {registrations.length > 0 && <div className="lookup-results">{registrations.map((item) => <div className="lookup-result" key={item.id}><span>{item.events?.title || item.event_id}</span><span>↗</span></div>)}</div>}
          </div>
        </section>
      </main>
      <footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark">g</span><span>gather<span className="brand-period">.</span></span></a><span>Find your people. Make a little room.</span><a href="#top">BACK TO TOP ↑</a></footer>
    </div>
  )
}

export default App
