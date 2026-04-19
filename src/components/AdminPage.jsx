import { useState, useEffect } from 'react'

const INITIAL_SEEDS = {
  east: [
    { id: 'e1', team1: 'Boston Bruins', team2: 'Buffalo Sabres' },
    { id: 'e2', team1: 'Montreal Canadiens', team2: 'Tampa Bay Lightning' },
    { id: 'e3', team1: 'Ottawa Senators', team2: 'Carolina Hurricanes' },
    { id: 'e4', team1: 'Philadelphia Flyers', team2: 'Pittsburgh Penguins' }
  ],
  west: [
    { id: 'w1', team1: 'Colorado Avalanche', team2: 'Los Angeles Kings' },
    { id: 'w2', team1: 'Dallas Stars', team2: 'Minnesota Wild' },
    { id: 'w3', team1: 'Las Vegas Golden Knights', team2: 'Utah Mammoth' },
    { id: 'w4', team1: 'Anaheim Ducks', team2: 'Edmonton Oilers' }
  ]
}

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [results, setResults] = useState({
    e1: '', e2: '', e3: '', e4: '',
    w1: '', w2: '', w3: '', w4: '',
    eSemi1: '', eSemi2: '',
    wSemi1: '', wSemi2: '',
    eastFinal: '',
    westFinal: '',
    champion: ''
  })
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if already authenticated
    const storedAuth = localStorage.getItem('adminAuth')
    if (storedAuth) {
      setIsAuthenticated(true)
      setPassword(storedAuth)
    }
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/results')
      if (response.ok) {
        const data = await response.json()
        if (Object.keys(data).length > 0) {
          setResults(prev => ({ ...prev, ...data }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch results:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    // Simple client-side check - real validation happens on POST
    if (password === 'playoff2026') {
      setIsAuthenticated(true)
      localStorage.setItem('adminAuth', password)
      setAuthError('')
    } else {
      setAuthError('Invalid password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    localStorage.removeItem('adminAuth')
  }

  const handleResultChange = (matchupId, winner) => {
    setResults(prev => {
      const newResults = { ...prev, [matchupId]: winner }

      // Clear dependent results when earlier round changes
      if (['e1', 'e2'].includes(matchupId)) {
        if (newResults.eSemi1 && ![newResults.e1, newResults.e2].includes(newResults.eSemi1)) {
          newResults.eSemi1 = ''
        }
      }
      if (['e3', 'e4'].includes(matchupId)) {
        if (newResults.eSemi2 && ![newResults.e3, newResults.e4].includes(newResults.eSemi2)) {
          newResults.eSemi2 = ''
        }
      }
      if (['w1', 'w2'].includes(matchupId)) {
        if (newResults.wSemi1 && ![newResults.w1, newResults.w2].includes(newResults.wSemi1)) {
          newResults.wSemi1 = ''
        }
      }
      if (['w3', 'w4'].includes(matchupId)) {
        if (newResults.wSemi2 && ![newResults.w3, newResults.w4].includes(newResults.wSemi2)) {
          newResults.wSemi2 = ''
        }
      }

      // Clear conference finals if semis change
      if (['eSemi1', 'eSemi2'].includes(matchupId) || ['e1', 'e2', 'e3', 'e4'].includes(matchupId)) {
        if (newResults.eastFinal && ![newResults.eSemi1, newResults.eSemi2].includes(newResults.eastFinal)) {
          newResults.eastFinal = ''
        }
      }
      if (['wSemi1', 'wSemi2'].includes(matchupId) || ['w1', 'w2', 'w3', 'w4'].includes(matchupId)) {
        if (newResults.westFinal && ![newResults.wSemi1, newResults.wSemi2].includes(newResults.westFinal)) {
          newResults.westFinal = ''
        }
      }

      // Clear champion if conference finals change
      if (newResults.champion && ![newResults.eastFinal, newResults.westFinal].includes(newResults.champion)) {
        newResults.champion = ''
      }

      return newResults
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password
        },
        body: JSON.stringify(results)
      })

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Results saved successfully!' })
      } else if (response.status === 401) {
        setSaveMessage({ type: 'error', text: 'Invalid admin password' })
        handleLogout()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save results. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const renderMatchup = (matchupId, team1, team2) => {
    const team1Display = team1 || 'TBD'
    const team2Display = team2 || 'TBD'
    const isDisabled = !team1 || !team2

    return (
      <div className="matchup admin-matchup">
        <div className="matchup-teams">
          <div className={`team ${!team1 ? 'pending' : ''}`}>{team1Display}</div>
          <div className="vs-text">VS</div>
          <div className={`team ${!team2 ? 'pending' : ''}`}>{team2Display}</div>
        </div>
        <select
          className="winner-select"
          value={results[matchupId]}
          onChange={(e) => handleResultChange(matchupId, e.target.value)}
          disabled={isDisabled}
        >
          <option value="">Not Played</option>
          {team1 && <option value={team1}>{team1}</option>}
          {team2 && <option value={team2}>{team2}</option>}
        </select>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="name-input"
            />
            <button type="submit" className="save-button">
              Login
            </button>
          </form>
          {authError && <div className="save-message error">{authError}</div>}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <div className="loading">Loading results...</div>
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Enter Game Results</h2>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>

      <div className="scoring-info">
        <h3>Scoring System</h3>
        <ul>
          <li>Round 1: 1 point per correct pick</li>
          <li>Round 2: 2 points per correct pick</li>
          <li>Conference Finals: 4 points per correct pick</li>
          <li>Stanley Cup Final: 8 points</li>
          <li>Correct Champion Bonus: +5 points</li>
        </ul>
      </div>

      <div className="bracket-container">
        {/* Eastern Conference */}
        <div className="conference">
          <h2>Eastern Conference</h2>
          <div className="rounds-container">
            <div className="round">
              <h3>Round 1</h3>
              {INITIAL_SEEDS.east.map(matchup => (
                <div key={matchup.id}>
                  {renderMatchup(matchup.id, matchup.team1, matchup.team2)}
                </div>
              ))}
            </div>
            <div className="round">
              <h3>Round 2</h3>
              {renderMatchup('eSemi1', results.e1, results.e2)}
              {renderMatchup('eSemi2', results.e3, results.e4)}
            </div>
            <div className="round">
              <h3>Conf Finals</h3>
              {renderMatchup('eastFinal', results.eSemi1, results.eSemi2)}
            </div>
          </div>
        </div>

        {/* Western Conference */}
        <div className="conference">
          <h2>Western Conference</h2>
          <div className="rounds-container">
            <div className="round">
              <h3>Round 1</h3>
              {INITIAL_SEEDS.west.map(matchup => (
                <div key={matchup.id}>
                  {renderMatchup(matchup.id, matchup.team1, matchup.team2)}
                </div>
              ))}
            </div>
            <div className="round">
              <h3>Round 2</h3>
              {renderMatchup('wSemi1', results.w1, results.w2)}
              {renderMatchup('wSemi2', results.w3, results.w4)}
            </div>
            <div className="round">
              <h3>Conf Finals</h3>
              {renderMatchup('westFinal', results.wSemi1, results.wSemi2)}
            </div>
          </div>
        </div>
      </div>

      {/* Stanley Cup Finals */}
      <div className="finals-section">
        <h2>Stanley Cup Finals</h2>
        <div className="finals-matchup">
          <div className={`finals-team ${!results.eastFinal ? 'pending' : ''}`}>
            {results.eastFinal || 'Eastern Champion'}
          </div>
          <div className="finals-vs">VS</div>
          <div className={`finals-team ${!results.westFinal ? 'pending' : ''}`}>
            {results.westFinal || 'Western Champion'}
          </div>
        </div>
        <div className="finals-select">
          <select
            className="winner-select"
            value={results.champion}
            onChange={(e) => handleResultChange('champion', e.target.value)}
            disabled={!results.eastFinal || !results.westFinal}
          >
            <option value="">Not Played</option>
            {results.eastFinal && <option value={results.eastFinal}>{results.eastFinal}</option>}
            {results.westFinal && <option value={results.westFinal}>{results.westFinal}</option>}
          </select>
        </div>
        {results.champion && (
          <div className="champion-display">
            <h3>Stanley Cup Champion</h3>
            <p>{results.champion}</p>
          </div>
        )}
      </div>

      {/* Save Section */}
      <div className="save-section">
        <button
          className="save-button"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Results'}
        </button>
        {saveMessage.text && (
          <div className={`save-message ${saveMessage.type}`}>
            {saveMessage.text}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
