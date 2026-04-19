import { useState, useEffect } from 'react'

function SavedBracketsPage() {
  const [brackets, setBrackets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBrackets()
  }, [])

  const fetchBrackets = async () => {
    try {
      const response = await fetch('/api/brackets')
      if (response.ok) {
        const data = await response.json()
        setBrackets(data)
      } else {
        throw new Error('Failed to fetch')
      }
    } catch (err) {
      setError('Failed to load saved brackets')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bracket?')) {
      return
    }

    try {
      const response = await fetch(`/api/brackets?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBrackets(prev => prev.filter(b => b.id !== id))
      } else {
        throw new Error('Failed to delete')
      }
    } catch (err) {
      alert('Failed to delete bracket. Please try again.')
    }
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

  const getRoundPicks = (picks, conference) => {
    const prefix = conference === 'east' ? 'e' : 'w'
    return [
      picks[`${prefix}1`],
      picks[`${prefix}2`],
      picks[`${prefix}3`],
      picks[`${prefix}4`]
    ].filter(Boolean)
  }

  const getSemiPicks = (picks, conference) => {
    const prefix = conference === 'east' ? 'e' : 'w'
    return [
      picks[`${prefix}Semi1`],
      picks[`${prefix}Semi2`]
    ].filter(Boolean)
  }

  if (loading) {
    return <div className="loading">Loading saved brackets...</div>
  }

  if (error) {
    return <div className="no-brackets">{error}</div>
  }

  return (
    <div className="saved-brackets-page">
      <h2>Saved Brackets</h2>

      {brackets.length === 0 ? (
        <div className="no-brackets">
          No brackets have been saved yet. Be the first to create one!
        </div>
      ) : (
        <div className="brackets-list">
          {brackets.map((bracket, index) => (
            <div key={index} className="bracket-card">
              <div className="bracket-card-header">
                <div className="bracket-card-title">
                  <h3>{bracket.name}</h3>
                  <span>{formatDate(bracket.createdAt)}</span>
                </div>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(bracket.id)}
                  title="Delete this bracket"
                >
                  ✕
                </button>
              </div>

              <div className="bracket-picks">
                <div className="pick-section">
                  <h4>East Round 1</h4>
                  <ul>
                    {getRoundPicks(bracket.picks, 'east').map((pick, i) => (
                      <li key={i}>{pick}</li>
                    ))}
                  </ul>
                </div>

                <div className="pick-section">
                  <h4>East Round 2</h4>
                  <ul>
                    {getSemiPicks(bracket.picks, 'east').map((pick, i) => (
                      <li key={i}>{pick}</li>
                    ))}
                  </ul>
                </div>

                <div className="pick-section">
                  <h4>East Final</h4>
                  <ul>
                    {bracket.picks.eastFinal && <li>{bracket.picks.eastFinal}</li>}
                  </ul>
                </div>

                <div className="pick-section">
                  <h4>West Round 1</h4>
                  <ul>
                    {getRoundPicks(bracket.picks, 'west').map((pick, i) => (
                      <li key={i}>{pick}</li>
                    ))}
                  </ul>
                </div>

                <div className="pick-section">
                  <h4>West Round 2</h4>
                  <ul>
                    {getSemiPicks(bracket.picks, 'west').map((pick, i) => (
                      <li key={i}>{pick}</li>
                    ))}
                  </ul>
                </div>

                <div className="pick-section">
                  <h4>West Final</h4>
                  <ul>
                    {bracket.picks.westFinal && <li>{bracket.picks.westFinal}</li>}
                  </ul>
                </div>
              </div>

              <div className="champion-pick">
                <h4>Stanley Cup Champion</h4>
                <p>{bracket.picks.champion}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SavedBracketsPage
