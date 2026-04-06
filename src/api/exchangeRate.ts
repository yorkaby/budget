export async function fetchEurRate(): Promise<number> {
  const res = await fetch('/api/eur-rate')
  if (!res.ok) throw new Error(`EUR rate proxy failed: ${res.status}`)
  const data = await res.json()
  if (!data.rate) throw new Error('No rate in response')
  return data.rate
}
