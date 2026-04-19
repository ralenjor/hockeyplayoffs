import { Redis } from '@upstash/redis'

const BRACKETS_KEY = 'nhl_brackets'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Check for required environment variables
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variables')
    return res.status(500).json({ error: 'Database not configured' })
  }

  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  })

  try {
    if (req.method === 'GET') {
      // Get all brackets
      const brackets = await redis.get(BRACKETS_KEY) || []
      return res.status(200).json(brackets)
    }

    if (req.method === 'POST') {
      // Get existing brackets
      const brackets = await redis.get(BRACKETS_KEY) || []

      // Add new bracket
      const newBracket = {
        id: Date.now(),
        name: req.body.name,
        picks: req.body.picks,
        createdAt: req.body.createdAt || new Date().toISOString()
      }

      brackets.push(newBracket)

      // Save back to Redis
      await redis.set(BRACKETS_KEY, brackets)

      return res.status(201).json(newBracket)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
