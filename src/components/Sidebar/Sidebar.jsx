import './Sidebar.css'

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        logo
      </div>

      <nav className="sidebar-nav">
        <button className="sidebar-item"> button1 </button>
        <button className="sidebar-item"> button2 </button>
        <button className="sidebar-item"> button3 </button>
        <button className="sidebar-item"> button4 </button>
      </nav>
    </aside>
  )
}

export default Sidebar