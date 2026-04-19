import express from 'express'
import cors from 'cors'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001
const BRACKETS_FILE = join(__dirname, 'brackets.json')

app.use(cors())
app.use(express.json())

// Initialize brackets file if it doesn't exist
async function initBracketsFile() {
  if (!existsSync(BRACKETS_FILE)) {
    await writeFile(BRACKETS_FILE, JSON.stringify([], null, 2))
  }
}

// Get all brackets
app.get('/api/brackets', async (req, res) => {
  try {
    await initBracketsFile()
    const data = await readFile(BRACKETS_FILE, 'utf-8')
    const brackets = JSON.parse(data)
    res.json(brackets)
  } catch (error) {
    console.error('Error reading brackets:', error)
    res.status(500).json({ error: 'Failed to read brackets' })
  }
})

// Save a new bracket
app.post('/api/brackets', async (req, res) => {
  try {
    await initBracketsFile()
    const data = await readFile(BRACKETS_FILE, 'utf-8')
    const brackets = JSON.parse(data)

    const newBracket = {
      id: Date.now(),
      name: req.body.name,
      picks: req.body.picks,
      createdAt: req.body.createdAt || new Date().toISOString()
    }

    brackets.push(newBracket)
    await writeFile(BRACKETS_FILE, JSON.stringify(brackets, null, 2))

    res.status(201).json(newBracket)
  } catch (error) {
    console.error('Error saving bracket:', error)
    res.status(500).json({ error: 'Failed to save bracket' })
  }
})

// Delete a bracket
app.delete('/api/brackets', async (req, res) => {
  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: 'Bracket ID is required' })
    }

    await initBracketsFile()
    const data = await readFile(BRACKETS_FILE, 'utf-8')
    const brackets = JSON.parse(data)

    const bracketId = parseInt(id, 10)
    const filteredBrackets = brackets.filter(b => b.id !== bracketId)

    if (filteredBrackets.length === brackets.length) {
      return res.status(404).json({ error: 'Bracket not found' })
    }

    await writeFile(BRACKETS_FILE, JSON.stringify(filteredBrackets, null, 2))

    res.status(200).json({ message: 'Bracket deleted successfully' })
  } catch (error) {
    console.error('Error deleting bracket:', error)
    res.status(500).json({ error: 'Failed to delete bracket' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
