import { Redis } from '@upstash/redis'

const RESULTS_KEY = 'nhl_results'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'playoff2026'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password')

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
      // Get current results - no auth needed for reading
      const results = await redis.get(RESULTS_KEY) || {}
      return res.status(200).json(results)
    }

    if (req.method === 'POST') {
      // Check admin password
      const password = req.headers['x-admin-password']

      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid admin password' })
      }

      // Save results
      const results = req.body

      await redis.set(RESULTS_KEY, results)

      return res.status(200).json({ message: 'Results saved successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
