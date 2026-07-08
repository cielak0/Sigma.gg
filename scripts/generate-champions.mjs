import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const VERSION = '14.24.1'
const BASE = `https://ddragon.leagueoflegends.com/cdn/${VERSION}`
const __dirname = dirname(fileURLToPath(import.meta.url))
const outputPath = join(__dirname, '..', 'public', 'data', 'champions.json')

const JUNGLE_IDS = new Set([
  'amumu', 'belveth', 'brand', 'briar', 'diana', 'ekko', 'elise', 'evelynn', 'fiddlesticks',
  'gragas', 'graves', 'gwen', 'hecarim', 'ivern', 'jarvaniv', 'jax', 'kayn', 'khazix', 'kindred',
  'leesin', 'lillia', 'masteryi', 'maokai', 'morgana', 'nautilus', 'nidalee', 'nocturne',
  'nunu', 'olaf', 'pantheon', 'qiyana', 'rammus', 'reksai', 'rengar', 'sejuani', 'shaco',
  'shyvana', 'skarner', 'sylas', 'taliyah', 'trundle', 'udyr', 'vi', 'viego', 'volibear',
  'warwick', 'monkeyking', 'xinzhao', 'zac', 'zed',
])

function toId(riotId) {
  return riotId.toLowerCase()
}

function getRole(tags) {
  const priority = ['Support', 'Marksman', 'Mage', 'Assassin', 'Fighter', 'Tank']
  for (const role of priority) {
    if (tags.includes(role)) return role
  }
  return tags[0] ?? 'Fighter'
}

function getLane(id, tags) {
  if (JUNGLE_IDS.has(id)) return 'Jungle'
  if (tags.includes('Support')) return 'Bot'
  if (tags.includes('Marksman')) return 'Bot'
  if (tags.includes('Mage') && tags.includes('Assassin')) return 'Mid'
  if (tags.includes('Assassin')) return 'Mid'
  if (tags.includes('Mage')) return 'Mid'
  if (tags.includes('Fighter') || tags.includes('Tank')) return 'Top'
  return 'Flex'
}

function getDifficulty(infoDifficulty) {
  if (infoDifficulty <= 3) return 'Makkelijk'
  if (infoDifficulty <= 6) return 'Gemiddeld'
  return 'Moeilijk'
}

function scaleStat(value) {
  if (value <= 3) return 1
  if (value <= 6) return 2
  return 3
}

function getStats(info, tags) {
  return {
    damage: scaleStat(Math.max(info.attack, info.magic)),
    toughness: scaleStat(info.defense),
    control: tags.includes('Support') || tags.includes('Tank') ? 3 : tags.includes('Mage') ? 2 : 1,
    mobility: tags.includes('Assassin') ? 3 : tags.includes('Fighter') ? 2 : 1,
    utility: tags.includes('Support') ? 3 : tags.includes('Tank') ? 2 : 1,
  }
}

function defaultTips(name, role, lane) {
  return [
    `${name} speelt het beste als ${role} op ${lane === 'Bot' ? 'bot lane' : lane.toLowerCase()}.`,
    'Bekijk ability combos in de practice tool voordat je ranked speelt.',
    'Pas je build aan op basis van het enemy team.',
  ]
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}`)
  return response.json()
}

async function fetchChampionDetail(riotId) {
  const data = await fetchJson(`${BASE}/data/en_US/champion/${riotId}.json`)
  return data.data[riotId]
}

async function main() {
  const listData = await fetchJson(`${BASE}/data/en_US/champion.json`)
  const entries = Object.values(listData.data)

  console.log(`Ophalen van ${entries.length} champions…`)

  const batchSize = 20
  const details = []

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize)
    const results = await Promise.all(batch.map((c) => fetchChampionDetail(c.id)))
    details.push(...results)
    console.log(`  ${Math.min(i + batchSize, entries.length)}/${entries.length}`)
  }

  const champions = details.map((champ) => {
    const id = toId(champ.id)
    const role = getRole(champ.tags)
    const lane = getLane(id, champ.tags)
    const tips = (champ.allytips?.length ? champ.allytips : defaultTips(champ.name, role, lane)).slice(0, 3)

    return {
      id,
      name: champ.name,
      title: champ.title,
      role,
      lane,
      difficulty: getDifficulty(champ.info.difficulty),
      image: `${BASE}/img/champion/${champ.image.full}`,
      splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.id}_0.jpg`,
      description: champ.blurb,
      tips,
      stats: getStats(champ.info, champ.tags),
    }
  })

  champions.sort((a, b) => a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' }))

  writeFileSync(outputPath, `${JSON.stringify(champions, null, 2)}\n`, 'utf8')
  console.log(`Geschreven: ${outputPath} (${champions.length} champions)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
