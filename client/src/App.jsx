import { Routes, Route, NavLink } from 'react-router-dom'
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
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-800 border-r border-dark-600 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-dark-600">
          <h1 className="text-xl font-bold text-white">Trading Journal</h1>
          <p className="text-xs text-gray-400 mt-1">AI-Powered Analysis</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-dark-600 text-xs text-gray-500">
          Trading Journal AI v1.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
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
        </div>
      </main>
    </div>
  )
}
