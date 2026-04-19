import { useState } from 'react'

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

function BracketPage() {
  const [picks, setPicks] = useState({
    // Round 1
    e1: '', e2: '', e3: '', e4: '',
    w1: '', w2: '', w3: '', w4: '',
    // Round 2 (Conference Semifinals)
    eSemi1: '', eSemi2: '',
    wSemi1: '', wSemi2: '',
    // Conference Finals
    eastFinal: '',
    westFinal: '',
    // Stanley Cup
    champion: ''
  })

  const [userName, setUserName] = useState('')
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' })
  const [isSaving, setIsSaving] = useState(false)

  const handlePickChange = (matchupId, winner) => {
    setPicks(prev => {
      const newPicks = { ...prev, [matchupId]: winner }

      // Clear dependent picks when earlier round changes
      if (['e1', 'e2'].includes(matchupId)) {
        if (newPicks.eSemi1 && ![newPicks.e1, newPicks.e2].includes(newPicks.eSemi1)) {
          newPicks.eSemi1 = ''
        }
      }
      if (['e3', 'e4'].includes(matchupId)) {
        if (newPicks.eSemi2 && ![newPicks.e3, newPicks.e4].includes(newPicks.eSemi2)) {
          newPicks.eSemi2 = ''
        }
      }
      if (['w1', 'w2'].includes(matchupId)) {
        if (newPicks.wSemi1 && ![newPicks.w1, newPicks.w2].includes(newPicks.wSemi1)) {
          newPicks.wSemi1 = ''
        }
      }
      if (['w3', 'w4'].includes(matchupId)) {
        if (newPicks.wSemi2 && ![newPicks.w3, newPicks.w4].includes(newPicks.wSemi2)) {
          newPicks.wSemi2 = ''
        }
      }

      // Clear conference finals if semis change
      if (['eSemi1', 'eSemi2'].includes(matchupId) || ['e1', 'e2', 'e3', 'e4'].includes(matchupId)) {
        if (newPicks.eastFinal && ![newPicks.eSemi1, newPicks.eSemi2].includes(newPicks.eastFinal)) {
          newPicks.eastFinal = ''
        }
      }
      if (['wSemi1', 'wSemi2'].includes(matchupId) || ['w1', 'w2', 'w3', 'w4'].includes(matchupId)) {
        if (newPicks.westFinal && ![newPicks.wSemi1, newPicks.wSemi2].includes(newPicks.westFinal)) {
          newPicks.westFinal = ''
        }
      }

      // Clear champion if conference finals change
      if (newPicks.champion && ![newPicks.eastFinal, newPicks.westFinal].includes(newPicks.champion)) {
        newPicks.champion = ''
      }

      return newPicks
    })
  }

  const handleSave = async () => {
    if (!userName.trim()) {
      setSaveMessage({ type: 'error', text: 'Please enter your name' })
      return
    }

    if (!picks.champion) {
      setSaveMessage({ type: 'error', text: 'Please complete your bracket by selecting a Stanley Cup champion' })
      return
    }

    setIsSaving(true)
    setSaveMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/brackets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName.trim(),
          picks,
          createdAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Bracket saved successfully!' })
        setUserName('')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save bracket. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const renderMatchup = (matchupId, team1, team2, disabled = false) => {
    const team1Display = team1 || 'TBD'
    const team2Display = team2 || 'TBD'
    const isDisabled = disabled || !team1 || !team2

    return (
      <div className="matchup">
        <div className="matchup-teams">
          <div className={`team ${!team1 ? 'pending' : ''}`}>{team1Display}</div>
          <div className="vs-text">VS</div>
          <div className={`team ${!team2 ? 'pending' : ''}`}>{team2Display}</div>
        </div>
        <select
          className="winner-select"
          value={picks[matchupId]}
          onChange={(e) => handlePickChange(matchupId, e.target.value)}
          disabled={isDisabled}
        >
          <option value="">Select Winner</option>
          {team1 && <option value={team1}>{team1}</option>}
          {team2 && <option value={team2}>{team2}</option>}
        </select>
      </div>
    )
  }

  return (
    <div className="bracket-page">
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
              {renderMatchup('eSemi1', picks.e1, picks.e2)}
              {renderMatchup('eSemi2', picks.e3, picks.e4)}
            </div>
            <div className="round">
              <h3>Conf Finals</h3>
              {renderMatchup('eastFinal', picks.eSemi1, picks.eSemi2)}
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
              {renderMatchup('wSemi1', picks.w1, picks.w2)}
              {renderMatchup('wSemi2', picks.w3, picks.w4)}
            </div>
            <div className="round">
              <h3>Conf Finals</h3>
              {renderMatchup('westFinal', picks.wSemi1, picks.wSemi2)}
            </div>
          </div>
        </div>
      </div>

      {/* Stanley Cup Finals */}
      <div className="finals-section">
        <h2>Stanley Cup Finals</h2>
        <div className="finals-matchup">
          <div className={`finals-team ${!picks.eastFinal ? 'pending' : ''}`}>
            {picks.eastFinal || 'Eastern Champion'}
          </div>
          <div className="finals-vs">VS</div>
          <div className={`finals-team ${!picks.westFinal ? 'pending' : ''}`}>
            {picks.westFinal || 'Western Champion'}
          </div>
        </div>
        <div className="finals-select">
          <select
            className="winner-select"
            value={picks.champion}
            onChange={(e) => handlePickChange('champion', e.target.value)}
            disabled={!picks.eastFinal || !picks.westFinal}
          >
            <option value="">Select Stanley Cup Champion</option>
            {picks.eastFinal && <option value={picks.eastFinal}>{picks.eastFinal}</option>}
            {picks.westFinal && <option value={picks.westFinal}>{picks.westFinal}</option>}
          </select>
        </div>
        {picks.champion && (
          <div className="champion-display">
            <h3>Stanley Cup Champion</h3>
            <p>{picks.champion}</p>
          </div>
        )}
      </div>

      {/* Save Section */}
      <div className="save-section">
        <label htmlFor="userName">Your Name:</label>
        <input
          type="text"
          id="userName"
          className="name-input"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <button
          className="save-button"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Bracket'}
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

export default BracketPage
