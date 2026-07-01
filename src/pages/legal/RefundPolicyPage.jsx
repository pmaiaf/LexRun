import LegalLayout from './LegalLayout.jsx'

export default function RefundPolicyPage() {
  return (
    <LegalLayout titulo="Política de Reembolso" atualizadoEm="1 de julho de 2026">
      <p>
        Esta Política de Reembolso se aplica a todas as assinaturas da plataforma LexRun
        contratadas por meio do site ou da própria Plataforma, em conformidade com o
        Código de Defesa do Consumidor (Lei nº 8.078/1990).
      </p>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">1. Direito de arrependimento (7 dias)</h2>
        <p>
          Por se tratar de uma contratação realizada fora do estabelecimento comercial
          (compra online), o Usuário tem direito ao <strong>cancelamento e reembolso
          integral</strong> do valor pago, sem necessidade de justificativa, dentro do
          prazo de <strong>7 (sete) dias corridos</strong> a contar da data da confirmação
          do pagamento, conforme o artigo 49 do Código de Defesa do Consumidor.
        </p>
        <p>
          Para exercer esse direito, acesse <strong>Planos &amp; Assinatura</strong> dentro da
          Plataforma e clique em "Solicitar reembolso" (disponível durante os 7 dias do prazo),
          ou envie uma solicitação para{' '}
          <a href="mailto:financeiro@lexrun.com.br" className="text-accent-600 hover:underline">financeiro@lexrun.com.br</a>.
          Pela Plataforma, você recebe um e-mail de confirmação e, ao confirmar, o reembolso é
          processado automaticamente pela Stripe e devolvido ao mesmo método de pagamento
          utilizado na compra, em prazo que pode variar conforme a instituição financeira do
          Usuário (geralmente entre 5 e 10 dias úteis).
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">2. Após o prazo de 7 dias</h2>
        <p>
          Encerrado o prazo de arrependimento, o cancelamento da assinatura pode ser feito
          a qualquer momento pelo portal de gerenciamento de assinatura, e produzirá efeitos
          ao final do período de cobrança já pago. Não há reembolso proporcional aos dias
          não utilizados dentro de um ciclo mensal já iniciado — o acesso à Plataforma
          permanece disponível até o fim desse ciclo, e a renovação automática é então
          interrompida.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">3. Cobranças duplicadas ou indevidas</h2>
        <p>
          Caso identifique uma cobrança duplicada, incorreta ou não reconhecida relacionada
          à sua assinatura LexRun, entre em contato imediatamente pelo e-mail{' '}
          <a href="mailto:financeiro@lexrun.com.br" className="text-accent-600 hover:underline">financeiro@lexrun.com.br</a>.
          Cobranças comprovadamente indevidas serão reembolsadas integralmente,
          independentemente do prazo de 7 dias mencionado acima.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">4. Mudança de plano</h2>
        <p>
          A troca entre planos (upgrade ou downgrade) pode ser feita a qualquer momento
          pela Plataforma. Ajustes de valor proporcional referentes à troca de plano
          são calculados automaticamente pela Stripe no próximo ciclo de cobrança.
        </p>
      </section>

      <p className="text-xs text-brand-900/40 pt-4">
        Dúvidas sobre reembolsos podem ser enviadas para{' '}
        <a href="mailto:financeiro@lexrun.com.br" className="text-accent-600 hover:underline">financeiro@lexrun.com.br</a>.
      </p>
    </LegalLayout>
  )
}
