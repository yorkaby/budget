import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const response = await fetch(
      'https://boi.org.il/PublicApi/GetExchangeRate?key=EUR&asXml=true',
    )
    if (!response.ok) {
      return res.status(502).json({ error: 'BOI request failed' })
    }
    const xml = await response.text()

    // Extract CurrentExchangeRate value with a simple regex (no DOM needed on server)
    const match = xml.match(/<CurrentExchangeRate[^>]*>([^<]+)<\/CurrentExchangeRate>/)
    if (!match) {
      return res.status(502).json({ error: 'CurrentExchangeRate not found in BOI response' })
    }

    const rate = parseFloat(match[1])
    if (!rate || isNaN(rate)) {
      return res.status(502).json({ error: `Invalid rate value: ${match[1]}` })
    }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate') // cache 30 min on CDN
    return res.status(200).json({ rate })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
