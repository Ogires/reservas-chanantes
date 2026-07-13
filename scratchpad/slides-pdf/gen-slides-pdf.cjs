/* Regenera el PDF 16:9 de la presentacion a partir del deck HTML.
 * El deck muestra una slide cada vez (clase .active, navegacion por hash #N),
 * asi que un print-to-pdf directo colapsa las paginas. Solucion: rasterizar
 * cada slide a PNG 1280x720 (@2x) con Playwright/Chromium y ensamblar un PDF
 * de una imagen por pagina, exactamente 1280x720 (16:9).
 * Uso:  node scratchpad/slides-pdf/gen-slides-pdf.cjs
 */
const fs = require('fs')
const path = require('path')
const { chromium } = require(path.resolve(__dirname, '../../node_modules/playwright'))

const deckDir = path.resolve(__dirname, '../../docs/presentacion')
const deckUrl = 'file:///' + path.join(deckDir, 'index.html').replace(/\\/g, '/')
const outPdf = path.join(deckDir, 'Reservas-Chanantes-TFM-presentacion.pdf')
const W = 1280, H = 720

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(deckUrl + '?nohint', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  const count = await page.evaluate(() => document.querySelectorAll('.slide').length)

  const shots = []
  for (let n = 1; n <= count; n++) {
    await page.evaluate((k) => { location.hash = '#' + k }, n)
    await page.waitForTimeout(950) // fade + asentar fuentes/imagenes
    const file = path.join(__dirname, 'shot-' + String(n).padStart(2, '0') + '.png')
    const buf = await page.screenshot({ type: 'png' })
    fs.writeFileSync(file, buf)
    shots.push('data:image/png;base64,' + buf.toString('base64'))
    console.log('[shot] slide', n)
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: ${W}px ${H}px; margin: 0; }
    html, body { margin: 0; padding: 0; }
    .pg { width: ${W}px; height: ${H}px; page-break-after: always; overflow: hidden; }
    .pg:last-child { page-break-after: auto; }
    img { width: ${W}px; height: ${H}px; display: block; }
  </style></head><body>
  ${shots.map((s) => `<div class="pg"><img src="${s}"></div>`).join('\n')}
  </body></html>`

  const p2 = await ctx.newPage()
  await p2.setContent(html, { waitUntil: 'load' })
  await p2.pdf({
    path: outPdf,
    width: W + 'px',
    height: H + 'px',
    printBackground: true,
    pageRanges: '1-' + count,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  })
  await browser.close()
  const kb = Math.round(fs.statSync(outPdf).size / 1024)
  console.log('[pdf] paginas:', count, '→', outPdf, '(' + kb + ' KB)')
})().catch((e) => { console.error(e); process.exit(1) })
