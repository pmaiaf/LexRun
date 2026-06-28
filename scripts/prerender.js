// scripts/prerender.js
//
// Gera HTML pronto (sem depender de JavaScript) para as páginas PÚBLICAS do
// site, logo depois do `vite build`. Isso ajuda o Google a indexar mais
// rápido/confiável, e principalmente resolve a prévia de link quebrada no
// WhatsApp/LinkedIn (esses não executam JavaScript, então sem isso eles
// sempre viam a mesma página em branco com título genérico).
//
// IMPORTANTE: isso não muda nada da área logada nem do comportamento da
// aplicação em si — só escreve arquivos HTML extras dentro de dist/, que o
// Vercel já serve com prioridade sobre o rewrite de SPA (comportamento
// padrão dele: arquivo estático existente sempre vence o rewrite). Quando o
// navegador carrega a página, o React de sempre (main.jsx, com
// createRoot().render()) assume o controle normalmente — não é hidratação,
// então não tem risco de warning/erro de mismatch.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

import LandingPage from '../src/pages/landing/LandingPage.jsx'
import SignupPage from '../src/pages/landing/SignupPage.jsx'
import TermsOfUsePage from '../src/pages/legal/TermsOfUsePage.jsx'
import PrivacyPolicyPage from '../src/pages/legal/PrivacyPolicyPage.jsx'
import RefundPolicyPage from '../src/pages/legal/RefundPolicyPage.jsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const SITE_URL = 'https://lexrun.com.br'
const OG_IMAGE = `${SITE_URL}/og-image.png`

// Cada entrada vira um dist/<arquivoSaida> pronto, com <title>/meta/OG
// próprios — diferente de hoje, onde toda página tem o mesmo <title> fixo.
const PAGINAS = [
  {
    rota: '/',
    arquivoSaida: 'index.html',
    Componente: LandingPage,
    title: 'LexRun — Software de Gestão para Escritórios de Advocacia',
    description: 'Sistema completo de gestão jurídica: processos, agenda, financeiro, cobranças automáticas e portal do cliente em um só lugar. Comece grátis.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'LexRun',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: 'Sistema de gestão jurídica para escritórios de advocacia: processos, agenda, financeiro, cobranças e portal do cliente.',
      offers: { '@type': 'Offer', price: '97.00', priceCurrency: 'BRL' },
      url: SITE_URL,
    },
  },
  {
    rota: '/comecar',
    arquivoSaida: 'comecar/index.html',
    Componente: SignupPage,
    title: 'Criar conta — LexRun',
    description: 'Comece a usar o LexRun hoje. Escolha seu plano e organize a gestão do seu escritório de advocacia em minutos.',
  },
  {
    rota: '/termos-de-uso',
    arquivoSaida: 'termos-de-uso/index.html',
    Componente: TermsOfUsePage,
    title: 'Termos de Uso — LexRun',
    description: 'Termos de uso da plataforma LexRun, sistema de gestão jurídica para escritórios de advocacia.',
  },
  {
    rota: '/politica-de-privacidade',
    arquivoSaida: 'politica-de-privacidade/index.html',
    Componente: PrivacyPolicyPage,
    title: 'Política de Privacidade — LexRun',
    description: 'Como o LexRun trata e protege os dados de escritórios de advocacia e de seus clientes, em conformidade com a LGPD.',
  },
  {
    rota: '/politica-de-reembolso',
    arquivoSaida: 'politica-de-reembolso/index.html',
    Componente: RefundPolicyPage,
    title: 'Política de Reembolso — LexRun',
    description: 'Condições de reembolso e direito de arrependimento (7 dias) das assinaturas LexRun, conforme o art. 49 do CDC.',
  },
]

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function montarHead(template, pagina) {
  const urlCanonica = `${SITE_URL}${pagina.rota}`
  const title = escaparHtml(pagina.title)
  const description = escaparHtml(pagina.description)

  const tagsExtras = `
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${urlCanonica}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:site_name" content="LexRun" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${urlCanonica}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    ${pagina.schema ? `<script type="application/ld+json">${JSON.stringify(pagina.schema)}</script>` : ''}
  `.trim()

  return template
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace('</head>', `  ${tagsExtras}\n  </head>`)
}

function montarBody(template, htmlRenderizado) {
  return template.replace('<div id="root"></div>', `<div id="root">${htmlRenderizado}</div>`)
}

async function main() {
  const templateOriginal = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8')

  for (const pagina of PAGINAS) {
    const htmlRenderizado = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [pagina.rota] },
        React.createElement(pagina.Componente)
      )
    )

    let html = montarHead(templateOriginal, pagina)
    html = montarBody(html, htmlRenderizado)

    const destino = path.join(distDir, pagina.arquivoSaida)
    fs.mkdirSync(path.dirname(destino), { recursive: true })
    fs.writeFileSync(destino, html, 'utf-8')
    console.log(`  ✓ prerender: ${pagina.rota} → dist/${pagina.arquivoSaida}`)
  }

  console.log(`\n✅ Prerender concluído (${PAGINAS.length} páginas públicas).\n`)
}

main().catch(err => {
  console.error('❌ Erro no prerender:', err)
  process.exit(1)
})
