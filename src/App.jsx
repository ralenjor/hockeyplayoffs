import { Routes, Route, Link } from 'react-router-dom'
import BracketPage from './components/BracketPage'
import SavedBracketsPage from './components/SavedBracketsPage'
import AdminPage from './components/AdminPage'

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>2026 NHL Playoff Bracket</h1>
          <nav>
            <Link to="/">Create Bracket</Link>
            <Link to="/saved">Leaderboard</Link>
            <Link to="/admin">Admin</Link>
          </nav>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<BracketPage />} />
          <Route path="/saved" element={<SavedBracketsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
