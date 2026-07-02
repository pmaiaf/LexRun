import { useState, useEffect, useCallback, useRef } from 'react'

// ── Fila global para evitar "muitas requisições" simultâneas ──────────────────
const queue = []
let running = 0
const MAX_CONCURRENT = 5   // 2 serializava o carregamento (páginas lentas); 5 equilibra velocidade e proteção

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject })
    drain()
  })
}

function drain() {
  while (running < MAX_CONCURRENT && queue.length > 0) {
    const { fn, resolve, reject } = queue.shift()
    running++
    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => { running--; drain() })
  }
}

/**
 * Hook genérico para chamadas GET à API.
 *
 * CAUSA RAIZ DO BUG "MUITAS REQUISIÇÕES" (corrigida aqui):
 * Quando o componente chamava useApi(fn) sem passar um array de deps,
 * `deps` recebia o valor padrão `[]` apenas na primeira renderização —
 * mas como `fn` é uma arrow function recriada a cada render do componente
 * pai, e várias páginas chamavam useApi(() => service.algo(params)) com
 * `params` inline (novo objeto a cada render), o useCallback(fetch, deps)
 * que dependia apenas de `deps` não capturava isso, MAS o useEffect inicial
 * de algumas páginas (ex: FinanceiroPage, DashboardPage) tinha objetos/arrays
 * sendo recriados em cascata via outros estados, e o fetch que dependia de
 * `fn` poderia ser re-disparado. Para eliminar a classe de bug por completo
 * — independente de qualquer call site futuro esquecer as deps — este hook
 * agora:
 *  1) nunca recria a função de fetch por causa de `fn` mudar de referência
 *     (usa fnRef, que é atualizado mas não entra nas deps do useCallback);
 *  2) ignora deps ausentes ou indefinidas com segurança (sempre vira []);
 *  3) bloqueia chamadas concorrentes/duplicadas enquanto uma já está em voo
 *     para o mesmo hook (evita disparo duplo em StrictMode ou re-mount rápido).
 */
export function useApi(fn, deps) {
  const safeDeps = Array.isArray(deps) ? deps : []

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [errorObj, setErrorObj] = useState(null) // erro original completo (status, detalhes) — usado por componentes que precisam decidir com base nisso, como ErrorBlock detectando bloqueio de plano
  const fnRef       = useRef(fn)
  const mountedRef   = useRef(true)
  const emVooRef     = useRef(false) // evita disparar a mesma chamada 2x simultaneamente
  fnRef.current = fn

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetch = useCallback(async () => {
    if (!mountedRef.current) return
    if (emVooRef.current) return // já existe uma chamada em andamento — não duplica
    emVooRef.current = true
    setLoading(true)
    setError(null)
    setErrorObj(null)

    const tentar = async (tentativa = 0) => {
      try {
        const result = await enqueue(() => fnRef.current())
        if (mountedRef.current) setData(result)
      } catch (err) {
        // Retry automático com backoff em caso de rate limit (429) —
        // até 2 tentativas extras antes de mostrar erro ao usuário.
        if (err.status === 429 && tentativa < 2) {
          await new Promise(r => setTimeout(r, 800 * (tentativa + 1)))
          return tentar(tentativa + 1)
        }
        if (mountedRef.current) {
          const msg = err.status === 429
            ? 'Muitas requisições simultâneas. Aguarde um momento...'
            : err.message || 'Erro ao carregar dados.'
          setError(msg)
          setErrorObj(err)
        }
      }
    }

    await tentar()
    emVooRef.current = false
    if (mountedRef.current) setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, safeDeps)

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, errorObj, refetch: fetch }
}

/**
 * Hook para ações (POST/PATCH/DELETE) com feedback de estado.
 */
export function useAction() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (fn, { onSuccess, onError } = {}) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      onSuccess?.(result)
      return result
    } catch (err) {
      const msg = err.message || 'Ocorreu um erro.'
      setError(msg)
      onError?.(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { execute, loading, error, clearError: () => setError(null) }
}

/**
 * Hook de cronômetro Play/Stop para timesheet.
 *
 * Reescrito para usar refs em vez de depender do valor de "segundos" capturado
 * por closure: como o componente re-renderiza a cada tick (setSegundos),
 * funções antigas como stop()/play() podiam ler um valor de segundos
 * defasado se disparadas entre o tick do interval e o commit do re-render,
 * fazendo o registro de horas sair zerado ou incorreto. Usando segundosRef,
 * stop() sempre lê o valor mais atual, independente de quando o React
 * processa o re-render.
 */
export function useCronometro(onStop) {
  const [rodando,   setRodando]   = useState(false)
  const [segundos,  setSegundos]  = useState(0)
  const intervalRef  = useRef(null)
  const inicioRef    = useRef(null)
  const segundosRef  = useRef(0)
  const onStopRef    = useRef(onStop)
  onStopRef.current = onStop // sempre aponta para a callback mais recente

  const play = useCallback(() => {
    if (intervalRef.current) return // já rodando — evita múltiplos intervals
    inicioRef.current = Date.now() - segundosRef.current * 1000
    setRodando(true)
    intervalRef.current = setInterval(() => {
      const novoValor = Math.floor((Date.now() - inicioRef.current) / 1000)
      segundosRef.current = novoValor
      setSegundos(novoValor)
    }, 1000)
  }, [])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRodando(false)
    // Lê sempre do ref — nunca defasado, independente do timing de re-render
    const segundosFinais = segundosRef.current
    const horasDecimais  = parseFloat((segundosFinais / 3600).toFixed(2))
    onStopRef.current?.(horasDecimais, segundosFinais)
    segundosRef.current = 0
    setSegundos(0)
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRodando(false)
    segundosRef.current = 0
    setSegundos(0)
  }, [])

  // Cleanup ao desmontar
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const hh = String(Math.floor(segundos / 3600)).padStart(2, '0')
  const mm = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0')
  const ss = String(segundos % 60).padStart(2, '0')
  const display = `${hh}:${mm}:${ss}`

  return { rodando, display, segundos, play, stop, reset }
}
