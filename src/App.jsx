import { Routes, Route, Link } from 'react-router-dom'
import BracketPage from './components/BracketPage'
import SavedBracketsPage from './components/SavedBracketsPage'

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>2026 NHL Playoff Bracket</h1>
          <nav>
            <Link to="/">Create Bracket</Link>
            <Link to="/saved">View Saved Brackets</Link>
          </nav>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<BracketPage />} />
          <Route path="/saved" element={<SavedBracketsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
