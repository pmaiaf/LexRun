/**
 * Máscaras de formatação aplicadas enquanto o usuário digita. Cada função
 * recebe o valor bruto do input (com ou sem máscara já aplicada) e devolve
 * a versão formatada — sempre trabalhando a partir dos dígitos puros, para
 * que colar um valor já formatado ou digitar livremente produza o mesmo
 * resultado.
 */

// Remove tudo que não for dígito
function apenasDigitos(v) {
  return (v || '').replace(/\D/g, '')
}

/**
 * CPF (11 dígitos) ou CNPJ (14 dígitos) — decide automaticamente qual
 * máscara aplicar com base na quantidade de dígitos já digitados.
 */
export function maskCpfCnpj(valor) {
  const d = apenasDigitos(valor).slice(0, 14)
  if (d.length <= 11) {
    // CPF: 000.000.000-00
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  // CNPJ: 00.000.000/0001-00
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

// Valida dígitos verificadores reais — não apenas o tamanho da string.
// Rejeita sequências como "111.111.111-11", comuns em digitação por engano.
export function validarCpf(cpfFormatado) {
  const cpf = apenasDigitos(cpfFormatado)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  if (resto !== parseInt(cpf[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  return resto === parseInt(cpf[10])
}

export function validarCnpj(cnpjFormatado) {
  const cnpj = apenasDigitos(cnpjFormatado)
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false
  const calcular = (base) => {
    let soma = 0, peso = base.length - 7
    for (let i = 0; i < base.length; i++) {
      soma += parseInt(base[i]) * peso
      peso = peso === 2 ? 9 : peso - 1
    }
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const dv1 = calcular(cnpj.slice(0, 12))
  if (dv1 !== parseInt(cnpj[12])) return false
  const dv2 = calcular(cnpj.slice(0, 13))
  return dv2 === parseInt(cnpj[13])
}

// Valida CPF (11 dígitos) ou CNPJ (14 dígitos) de acordo com o tamanho
export function validarCpfCnpj(valor) {
  const d = apenasDigitos(valor)
  if (d.length === 11) return validarCpf(d)
  if (d.length === 14) return validarCnpj(d)
  return false
}

/**
 * Telefone brasileiro — detecta automaticamente celular (9 dígitos) vs
 * fixo (8 dígitos) com base no que já foi digitado.
 */
export function maskTelefone(valor) {
  const d = apenasDigitos(valor).slice(0, 11)
  if (d.length <= 10) {
    // Fixo: (00) 0000-0000
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  // Celular: (00) 00000-0000
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

/** CEP — 00000-000 */
export function maskCep(valor) {
  const d = apenasDigitos(valor).slice(0, 8)
  return d.replace(/(\d{5})(\d{1,3})$/, '$1-$2')
}

/**
 * Número de processo no padrão CNJ: NNNNNNN-NN.AAAA.J.TR.OOOO
 * (7 dígitos do número sequencial, 2 do dígito verificador, 4 do ano,
 * 1 do segmento do Judiciário, 2 do tribunal, 4 da origem/vara — 20 dígitos no total).
 */
export function maskProcessoCnj(valor) {
  const d = apenasDigitos(valor).slice(0, 20)
  return d
    .replace(/(\d{7})(\d)/, '$1-$2')
    .replace(/(\d{7}-\d{2})(\d)/, '$1.$2')
    .replace(/(\d{7}-\d{2}\.\d{4})(\d)/, '$1.$2')
    .replace(/(\d{7}-\d{2}\.\d{4}\.\d)(\d)/, '$1.$2')
    .replace(/(\d{7}-\d{2}\.\d{4}\.\d\.\d{2})(\d)/, '$1.$2')
}

export function processoCnjCompleto(valorFormatado) {
  return apenasDigitos(valorFormatado).length === 20
}

/**
 * Busca endereço pelo CEP via ViaCEP. Retorna null se o CEP for inválido,
 * inexistente, ou se a API estiver inacessível — quem chama decide como
 * tratar (geralmente: preencher os campos se vier algo, ignorar se null).
 */
export async function buscarEnderecoPorCep(cepFormatado) {
  const cep = apenasDigitos(cepFormatado)
  if (cep.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await res.json()
    if (data.erro) return null
    return {
      rua: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || '',
    }
  } catch {
    return null // falha de rede não deve travar o formulário — usuário preenche manualmente
  }
}
