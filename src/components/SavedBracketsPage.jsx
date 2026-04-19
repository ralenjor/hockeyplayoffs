import { useState, useEffect } from 'react'

// Scoring configuration
const SCORING = {
  round1: 1,      // e1-e4, w1-w4
  round2: 2,      // eSemi1, eSemi2, wSemi1, wSemi2
  confFinals: 4,  // eastFinal, westFinal
  scFinal: 8,     // champion
  championBonus: 5
}

const ROUND1_KEYS = ['e1', 'e2', 'e3', 'e4', 'w1', 'w2', 'w3', 'w4']
const ROUND2_KEYS = ['eSemi1', 'eSemi2', 'wSemi1', 'wSemi2']
const CONF_FINALS_KEYS = ['eastFinal', 'westFinal']

function SavedBracketsPage() {
  const [brackets, setBrackets] = useState([])
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check if user is authenticated as admin
    const adminAuth = localStorage.getItem('adminAuth')
    setIsAdmin(adminAuth === 'playoff2026')
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [bracketsRes, resultsRes] = await Promise.all([
        fetch('/api/brackets'),
        fetch('/api/results')
      ])

      if (bracketsRes.ok) {
        const bracketsData = await bracketsRes.json()
        setBrackets(bracketsData)
      } else {
        throw new Error('Failed to fetch brackets')
      }

      if (resultsRes.ok) {
        const resultsData = await resultsRes.json()
        setResults(resultsData)
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bracket?')) {
      return
    }

    const adminAuth = localStorage.getItem('adminAuth')

    try {
      const response = await fetch(`/api/brackets?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Password': adminAuth
        }
      })

      if (response.ok) {
        setBrackets(prev => prev.filter(b => b.id !== id))
      } else if (response.status === 401) {
        alert('Admin authentication required to delete brackets.')
        setIsAdmin(false)
      } else {
        throw new Error('Failed to delete')
      }
    } catch (err) {
      alert('Failed to delete bracket. Please try again.')
    }
  }

  const calculateScore = (picks) => {
    let score = 0
    let correct = 0
    let incorrect = 0
    let pending = 0

    // Round 1
    ROUND1_KEYS.forEach(key => {
      if (!results[key]) {
        pending++
      } else if (picks[key] === results[key]) {
        score += SCORING.round1
        correct++
      } else {
        incorrect++
      }
    })

    // Round 2
    ROUND2_KEYS.forEach(key => {
      if (!results[key]) {
        pending++
      } else if (picks[key] === results[key]) {
        score += SCORING.round2
        correct++
      } else {
        incorrect++
      }
    })

    // Conference Finals
    CONF_FINALS_KEYS.forEach(key => {
      if (!results[key]) {
        pending++
      } else if (picks[key] === results[key]) {
        score += SCORING.confFinals
        correct++
      } else {
        incorrect++
      }
    })

    // Stanley Cup Final
    if (!results.champion) {
      pending++
    } else if (picks.champion === results.champion) {
      score += SCORING.scFinal
      score += SCORING.championBonus
      correct++
    } else {
      incorrect++
    }

    return { score, correct, incorrect, pending }
  }

  const getPickStatus = (pick, resultKey) => {
    if (!results[resultKey]) return 'pending'
    return pick === results[resultKey] ? 'correct' : 'incorrect'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const hasResults = Object.keys(results).some(key => results[key])

  // Sort brackets by score (highest first)
  const sortedBrackets = [...brackets].sort((a, b) => {
    const scoreA = calculateScore(a.picks).score
    const scoreB = calculateScore(b.picks).score
    return scoreB - scoreA
  })

  if (loading) {
    return <div className="loading">Loading leaderboard...</div>
  }

  if (error) {
    return <div className="no-brackets">{error}</div>
  }

  return (
    <div className="saved-brackets-page">
      <h2>Leaderboard</h2>

      {hasResults && (
        <div className="scoring-legend">
          <span className="legend-item correct">Correct</span>
          <span className="legend-item incorrect">Incorrect</span>
          <span className="legend-item pending">Pending</span>
        </div>
      )}

      {brackets.length === 0 ? (
        <div className="no-brackets">
          No brackets have been saved yet. Be the first to create one!
        </div>
      ) : (
        <div className="brackets-list">
          {sortedBrackets.map((bracket, index) => {
            const { score, correct, incorrect, pending } = calculateScore(bracket.picks)
            const rank = index + 1

            return (
              <div key={bracket.id} className="bracket-card">
                <div className="bracket-card-header">
                  <div className="bracket-card-title">
                    <div className="bracket-rank-name">
                      {hasResults && <span className="rank">#{rank}</span>}
                      <h3>{bracket.name}</h3>
                    </div>
                    <span>{formatDate(bracket.createdAt)}</span>
                  </div>
                  {hasResults && (
                    <div className="score-display">
                      <span className="score-points">{score} pts</span>
                      <span className="score-breakdown">
                        {correct}W - {incorrect}L - {pending}P
                      </span>
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(bracket.id)}
                      title="Delete this bracket"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="bracket-picks">
                  <div className="pick-section">
                    <h4>East Round 1 <span className="points-label">(1 pt each)</span></h4>
                    <ul>
                      {['e1', 'e2', 'e3', 'e4'].map(key => (
                        bracket.picks[key] && (
                          <li key={key} className={hasResults ? getPickStatus(bracket.picks[key], key) : ''}>
                            {bracket.picks[key]}
                          </li>
                        )
                      ))}
                    </ul>
                  </div>

                  <div className="pick-section">
                    <h4>East Round 2 <span className="points-label">(2 pts each)</span></h4>
                    <ul>
                      {['eSemi1', 'eSemi2'].map(key => (
                        bracket.picks[key] && (
                          <li key={key} className={hasResults ? getPickStatus(bracket.picks[key], key) : ''}>
                            {bracket.picks[key]}
                          </li>
                        )
                      ))}
                    </ul>
                  </div>

                  <div className="pick-section">
                    <h4>East Final <span className="points-label">(4 pts)</span></h4>
                    <ul>
                      {bracket.picks.eastFinal && (
                        <li className={hasResults ? getPickStatus(bracket.picks.eastFinal, 'eastFinal') : ''}>
                          {bracket.picks.eastFinal}
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="pick-section">
                    <h4>West Round 1 <span className="points-label">(1 pt each)</span></h4>
                    <ul>
                      {['w1', 'w2', 'w3', 'w4'].map(key => (
                        bracket.picks[key] && (
                          <li key={key} className={hasResults ? getPickStatus(bracket.picks[key], key) : ''}>
                            {bracket.picks[key]}
                          </li>
                        )
                      ))}
                    </ul>
                  </div>

                  <div className="pick-section">
                    <h4>West Round 2 <span className="points-label">(2 pts each)</span></h4>
                    <ul>
                      {['wSemi1', 'wSemi2'].map(key => (
                        bracket.picks[key] && (
                          <li key={key} className={hasResults ? getPickStatus(bracket.picks[key], key) : ''}>
                            {bracket.picks[key]}
                          </li>
                        )
                      ))}
                    </ul>
                  </div>

                  <div className="pick-section">
                    <h4>West Final <span className="points-label">(4 pts)</span></h4>
                    <ul>
                      {bracket.picks.westFinal && (
                        <li className={hasResults ? getPickStatus(bracket.picks.westFinal, 'westFinal') : ''}>
                          {bracket.picks.westFinal}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className={`champion-pick ${hasResults ? getPickStatus(bracket.picks.champion, 'champion') : ''}`}>
                  <h4>Stanley Cup Champion <span className="points-label">(8 pts + 5 bonus)</span></h4>
                  <p>{bracket.picks.champion}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SavedBracketsPage
