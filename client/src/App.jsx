import { useState } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TradeList from './pages/TradeList'
import TradeForm from './pages/TradeForm'
import TradeDetail from './pages/TradeDetail'
import PreMarket from './pages/PreMarket'
import AICoach from './pages/AICoach'
import DailyJournal from './pages/DailyJournal'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/trades', label: 'Trades', icon: '📈' },
  { to: '/trade/new', label: 'Nuevo Trade', icon: '➕' },
  { to: '/premarket', label: 'Pre-Market', icon: '🔍' },
  { to: '/daily', label: 'Diario', icon: '📝' },
  { to: '/ai', label: 'AI Coach', icon: '🤖' },
]

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {sidebarOpen
              ? <path d="M18 6L6 18M6 6l12 12"/>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
        <div className="mobile-header-title">
          <h1>Trading Journal</h1>
          <span>AI-Powered Analysis</span>
        </div>
      </header>

      {/* Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h1>Trading Journal</h1>
          <p>AI-Powered Analysis</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          Trading Journal AI v1.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trades" element={<TradeList />} />
          <Route path="/trade/new" element={<TradeForm />} />
          <Route path="/trade/edit/:id" element={<TradeForm />} />
          <Route path="/trade/:id" element={<TradeDetail />} />
          <Route path="/premarket" element={<PreMarket />} />
          <Route path="/daily" element={<DailyJournal />} />
          <Route path="/ai" element={<AICoach />} />
        </Routes>
      </main>
    </div>
  )
}
