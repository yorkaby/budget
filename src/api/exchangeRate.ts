const BOI_EUR_URL = 'https://boi.org.il/PublicApi/GetExchangeRate?key=EUR&asXml=true'

export async function fetchEurRate(): Promise<number> {
  const res = await fetch(BOI_EUR_URL)
  if (!res.ok) throw new Error('Failed to fetch EUR rate from BOI')
  const text = await res.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'application/xml')
  const nodes = doc.evaluate(
    '//*[local-name()="CurrentExchangeRate"]',
    doc,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  )
  const node = nodes.singleNodeValue
  if (!node?.textContent) throw new Error('CurrentExchangeRate not found in BOI response')
  const rate = parseFloat(node.textContent)
  if (!rate || isNaN(rate)) throw new Error(`Invalid EUR rate: ${node.textContent}`)
  return rate
}
