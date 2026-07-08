import { readFileSync, writeFileSync, existsSync } from 'fs'
import { execFileSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const mdPath = join(root, 'docs', 'VERSLAG.md')
const htmlPath = join(root, 'docs', 'VERSLAG.html')
const pdfPath = join(root, 'docs', 'VERSLAG.pdf')

const edgePaths = [
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
]

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out = []
  let inTable = false
  let inList = false

  const closeList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('|')) {
      closeList()
      const cells = line.split('|').slice(1, -1).map((c) => c.trim())
      const next = lines[i + 1] ?? ''
      const isSeparator = /^\|[\s\-:|]+\|$/.test(next)

      if (!inTable) {
        out.push('<table>')
        inTable = true
      }

      if (isSeparator) {
        i++
        continue
      }

      const tag = inTable && out[out.length - 1] === '<table>' ? 'th' : 'td'
      out.push('<tr>' + cells.map((c) => `<${tag}>${inline(c)}</${tag}>`).join('') + '</tr>')
      continue
    } else if (inTable) {
      out.push('</table>')
      inTable = false
    }

    if (line.startsWith('### ')) {
      closeList()
      out.push(`<h3>${inline(line.slice(4))}</h3>`)
    } else if (line.startsWith('## ')) {
      closeList()
      out.push(`<h2>${inline(line.slice(3))}</h2>`)
    } else if (line.startsWith('# ')) {
      closeList()
      out.push(`<h1>${inline(line.slice(2))}</h1>`)
    } else if (line.startsWith('- ')) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(line.slice(2))}</li>`)
    } else if (line.trim() === '---') {
      closeList()
      out.push('<hr>')
    } else if (/^\d+\.\s/.test(line)) {
      closeList()
      out.push(`<p class="numbered">${inline(line)}</p>`)
    } else if (line.trim() === '') {
      closeList()
    } else {
      closeList()
      out.push(`<p>${inline(line)}</p>`)
    }
  }

  closeList()
  if (inTable) out.push('</table>')
  return out.join('\n')
}

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
}

const md = readFileSync(mdPath, 'utf8')
const body = mdToHtml(md)

const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Verslag — Front-end Framework Keuzedeel</title>
  <style>
    @page { margin: 2cm; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      font-size: 11pt;
    }
    h1 { font-size: 22pt; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
    h2 { font-size: 16pt; margin-top: 28px; color: #1e40af; }
    h3 { font-size: 13pt; margin-top: 20px; }
    p { margin: 8px 0; }
    p.numbered { margin-left: 0; }
    ul { margin: 8px 0 8px 20px; }
    li { margin: 4px 0; }
    hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
    th { background: #eff6ff; font-weight: 600; }
    a { color: #2563eb; text-decoration: none; }
    strong { font-weight: 600; }
  </style>
</head>
<body>
${body}
</body>
</html>`

writeFileSync(htmlPath, html, 'utf8')

const browser = edgePaths.find((p) => p && existsSync(p))
if (!browser) {
  console.error('Geen Edge of Chrome gevonden. HTML opgeslagen als docs/VERSLAG.html')
  process.exit(1)
}

const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/').replace(/ /g, '%20')

execFileSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  `--print-to-pdf=${pdfPath}`,
  fileUrl,
], { stdio: 'inherit' })

console.log(`PDF gegenereerd: ${pdfPath}`)
