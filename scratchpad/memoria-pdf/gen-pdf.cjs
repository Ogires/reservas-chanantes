/* Genera el PDF A4 de la memoria a partir de los .md de docs/memoria.
 * markdown-it (Node) -> HTML; Mermaid (navegador, CDN) renderiza los 9
 * diagramas; Playwright/Chromium page.pdf() produce el A4.
 * Uso:  node scratchpad/memoria-pdf/gen-pdf.cjs
 */
const fs = require('fs')
const path = require('path')
const MarkdownIt = require('markdown-it')
const { chromium } = require(path.resolve(__dirname, '../../node_modules/playwright'))

const memoriaDir = path.resolve(__dirname, '../../docs/memoria')
const outPdf = path.join(memoriaDir, 'Reservas-Chanantes-TFM-memoria.pdf')

// README = portada + resumen; luego los capítulos en orden.
const files = [
  'README.md',
  '01-introduccion.md', '02-estado-del-arte.md', '03-requisitos-casos-uso.md',
  '04-diseno-arquitectura.md', '05-implementacion.md', '06-pruebas-calidad.md',
  '07-conclusiones.md', '08-bibliografia.md', '09-anexos.md',
]

// Elimina las líneas de navegación (footer "[◀ … · 🏠 Índice · … ▶]") que
// solo tienen sentido en la web, no en el PDF.
function stripNav(mdText) {
  return mdText
    .split(/\r?\n/)
    .filter((line) => !/🏠\s*Índice/.test(line) && !/^\s*\[◀/.test(line))
    .join('\n')
}

const md = new MarkdownIt({ html: true, linkify: false, typographer: false })
const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules)
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  if ((token.info || '').trim() === 'mermaid') {
    return `<div class="mermaid">\n${token.content}\n</div>\n`
  }
  return defaultFence(tokens, idx, options, env, self)
}

const bodyHtml = files
  .map((f, i) => {
    const raw = stripNav(fs.readFileSync(path.join(memoriaDir, f), 'utf8'))
    const html = md.render(raw)
    const brk = i < files.length - 1 ? '<div class="page-break"></div>' : ''
    return `<section class="doc">${html}</section>${brk}`
  })
  .join('\n')

// Incrusta las imágenes locales (img/...) como data URI: setContent no tiene
// base URL, así que las rutas relativas no cargarían de otro modo.
function inlineImages(html) {
  return html.replace(/src="(img\/[^"]+)"/g, (m, rel) => {
    try {
      const b64 = fs.readFileSync(path.join(memoriaDir, rel)).toString('base64')
      const ext = path.extname(rel).slice(1).toLowerCase()
      const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`
      return `src="data:${mime};base64,${b64}"`
    } catch {
      console.warn('[img] no encontrada:', rel)
      return m
    }
  })
}

const page = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<style>
  :root { --ink:#1a1a1a; --muted:#666; --line:#d9d9d9; --accent:#0b3d6b; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: var(--ink);
         font-size: 10.6pt; line-height: 1.5; margin: 0; }
  .doc { }
  h1, h2, h3, h4 { font-family: 'Segoe UI', Arial, sans-serif; color: var(--accent);
                   line-height: 1.25; page-break-after: avoid; }
  h1 { font-size: 20pt; border-bottom: 2px solid var(--accent); padding-bottom: 6px; margin: 0 0 16px; }
  h2 { font-size: 14.5pt; margin: 22px 0 8px; }
  h3 { font-size: 12pt; margin: 16px 0 6px; }
  h4 { font-size: 10.8pt; margin: 12px 0 4px; }
  p { margin: 0 0 9px; text-align: justify; }
  a { color: var(--accent); text-decoration: none; }
  code { font-family: 'Consolas','Courier New',monospace; font-size: 9pt;
         background: #f2f4f7; padding: 1px 4px; border-radius: 3px; }
  pre { background: #f6f8fa; border: 1px solid var(--line); border-radius: 6px;
        padding: 10px 12px; overflow-x: auto; page-break-inside: avoid; }
  pre code { background: none; padding: 0; font-size: 8.6pt; line-height: 1.4; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 9pt;
          page-break-inside: avoid; }
  th, td { border: 1px solid var(--line); padding: 5px 8px; text-align: left; vertical-align: top; }
  th { background: #eef2f6; font-family: 'Segoe UI', Arial, sans-serif; }
  blockquote { border-left: 3px solid var(--accent); margin: 10px 0; padding: 2px 14px;
               color: var(--muted); background: #fafbfc; }
  ul, ol { margin: 0 0 9px; padding-left: 22px; }
  li { margin: 2px 0; }
  svg { max-width: 100%; height: auto; }
  img { display: block; margin: 12px auto; max-width: 92%; height: auto;
        border: 1px solid var(--line); border-radius: 6px; page-break-inside: avoid; }
  hr { border: none; border-top: 1px solid var(--line); margin: 16px 0; }
  .mermaid { text-align: center; margin: 14px 0; page-break-inside: avoid; }
  .mermaid svg { max-width: 100%; height: auto; }
  .page-break { page-break-after: always; }
  /* Portada centrada (primer <section>) */
  .doc:first-child > div[align="center"] { text-align: center; }
</style></head>
<body>
${inlineImages(bodyHtml)}
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
  window.__done = false;
  try {
    mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
    mermaid.run().then(function(){ window.__done = true; })
                 .catch(function(e){ window.__err = String(e); window.__done = true; });
  } catch (e) { window.__err = String(e); window.__done = true; }
</script>
</body></html>`

fs.writeFileSync(path.join(__dirname, 'out.html'), page, 'utf8')

;(async () => {
  const browser = await chromium.launch()
  const p = await browser.newPage()
  await p.setContent(page, { waitUntil: 'networkidle', timeout: 60000 })
  await p.waitForFunction(() => window.__done === true, { timeout: 90000 })
  const err = await p.evaluate(() => window.__err || null)
  const nDiagrams = await p.evaluate(() => document.querySelectorAll('.mermaid svg').length)
  if (err) console.warn('[mermaid] aviso:', err)
  console.log('[mermaid] diagramas renderizados (svg):', nDiagrams)

  // Capturas de verificación (no forman parte del PDF).
  if (process.env.SHOTS) {
    const shot = async (name, locator) => {
      try {
        const el = locator.first()
        await el.scrollIntoViewIfNeeded()
        await el.screenshot({ path: path.join(__dirname, name) })
        console.log('[shot]', name)
      } catch (e) { console.warn('[shot] fallo', name, String(e)) }
    }
    await shot('shot-cover.png', p.locator('section.doc').first())
    await shot('shot-mermaid.png', p.locator('.mermaid').nth(3)) // uno de los de ch.4
    await shot('shot-6-7.png', p.locator('p', { hasText: 'pipeline de despliegue encadenado' }))
    await shot('shot-anexoD.png', p.locator('table', { has: p.locator('code', { hasText: 'VERCEL_TOKEN' }) }))
  }
  await p.pdf({
    path: outPdf,
    format: 'A4',
    printBackground: true,
    margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '16mm' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate:
      '<div style="width:100%;font-size:8px;color:#888;text-align:center;font-family:Arial;">' +
      'Reservas Chanantes · TFM &nbsp;—&nbsp; <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  })
  await browser.close()
  const kb = Math.round(fs.statSync(outPdf).size / 1024)
  console.log('[pdf] escrito:', outPdf, '(' + kb + ' KB)')
})().catch((e) => { console.error(e); process.exit(1) })
