import { clsx } from 'clsx'

export function cn(...inputs) { return clsx(inputs) }

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  // Suporta 'YYYY-MM-DD' e ISO strings
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR')
}

export function formatDatetime(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return `${d.toLocaleDateString('pt-BR')} · ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`
}

export function diasParaPrazo(prazo) {
  if (!prazo) return null
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const data = new Date(prazo.includes('T') ? prazo : prazo + 'T12:00:00')
  return Math.ceil((data - hoje) / (1000 * 60 * 60 * 24))
}

export function prazoLabel(prazo) {
  const dias = diasParaPrazo(prazo)
  if (dias === null)  return { label: '—',         class: 'badge-gray'  }
  if (dias < 0)       return { label: 'Vencido',   class: 'badge-red'   }
  if (dias === 0)     return { label: 'Hoje',       class: 'badge-red'   }
  if (dias <= 1)      return { label: '24h',        class: 'badge-red'   }
  if (dias <= 2)      return { label: '48h',        class: 'badge-amber' }
  if (dias <= 7)      return { label: `${dias}d`,   class: 'badge-gray'  }
  return                     { label: `${dias}d`,   class: 'badge-gray'  }
}

export function prioridadeClass(p) {
  if (p === 'Alta')  return 'badge-red'
  // "Médio" deixa de usar âmbar: é o caso comum, não deve competir
  // visualmente com prazos vencidos ou prioridade alta de verdade.
  return 'badge-gray'
}

export function statusCobrancaClass(s) {
  if (s === 'Pago')        return 'badge-green'
  if (s === 'Atrasado')    return 'badge-red'
  if (s === 'Vence hoje')  return 'badge-amber'
  return 'badge-gray'
}

export function avatarInitials(nome) {
  if (!nome) return '?'
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export const AVATAR_COLORS = [
  'bg-brand-100 text-brand-800',
  'bg-accent-100 text-accent-600',
  'bg-amber-50 text-amber-700',
  'bg-purple-50 text-purple-700',
  'bg-pink-50 text-pink-700',
]

export function avatarColor(id) {
  const n = parseInt(String(id).replace(/\D/g,'').slice(-4) || '0', 10)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}
