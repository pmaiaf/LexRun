import LegalLayout from './LegalLayout.jsx'

export default function TermsOfUsePage() {
  return (
    <LegalLayout titulo="Termos de Uso" atualizadoEm="17 de junho de 2026">
      <p>
        Estes Termos de Uso regulam o acesso e a utilização da plataforma LexRun
        ("Plataforma", "Sistema" ou "LexRun"), disponibilizada pela <strong>LexRun</strong>{' '}
        ("LexRun", "nós"). Ao criar uma conta ou
        utilizar a Plataforma, você ("Usuário", "Cliente" ou "Escritório") declara que
        leu, compreendeu e aceita integralmente estes Termos.
      </p>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">1. Objeto</h2>
        <p>
          A LexRun oferece um sistema de gestão para escritórios de advocacia e
          profissionais do Direito, incluindo, sem se limitar a: gestão de processos,
          clientes, agenda, financeiro, geração de documentos, portal do cliente e
          integrações com terceiros (como Mercado Pago, WhatsApp e provedores de
          inteligência artificial). A Plataforma é fornecida no modelo de assinatura
          (Software as a Service), mediante pagamento recorrente.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">2. Cadastro e responsabilidade pela conta</h2>
        <p>
          Para utilizar a Plataforma, o Usuário deve fornecer dados verdadeiros, completos
          e atualizados no momento do cadastro. O Usuário é o único responsável pela
          guarda de suas credenciais de acesso (e-mail e senha) e por todas as atividades
          realizadas em sua conta. A LexRun não se responsabiliza por danos decorrentes do
          uso indevido das credenciais por terceiros, salvo em caso de falha comprovada de
          segurança da própria Plataforma.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">3. Assinatura e pagamento</h2>
        <p>
          O acesso à Plataforma é condicionado à confirmação do pagamento da assinatura
          referente ao plano escolhido (Básico, Professional ou Banca), processado por
          meio do provedor de pagamentos Stripe. A cobrança é recorrente e mensal, e o
          valor vigente de cada plano é exibido na página de planos antes da confirmação
          da compra. O Usuário pode cancelar a assinatura a qualquer momento por meio do
          portal de gerenciamento de assinatura, disponível na própria Plataforma, sem
          necessidade de aviso prévio ou justificativa.
        </p>
        <p>
          O cancelamento interrompe a renovação automática, mas não gera reembolso
          proporcional ao período já pago, exceto nas hipóteses previstas na nossa{' '}
          <a href="/politica-de-reembolso" className="text-accent-600 hover:underline">Política de Reembolso</a>.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">4. Uso aceitável</h2>
        <p>
          O Usuário compromete-se a utilizar a Plataforma exclusivamente para fins lícitos
          relacionados à gestão de sua atividade profissional, sendo expressamente vedado:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Utilizar a Plataforma para armazenar ou processar dados obtidos de forma ilícita;</li>
          <li>Tentar acessar áreas, dados ou contas de outros escritórios sem autorização;</li>
          <li>Realizar engenharia reversa, copiar ou tentar replicar a Plataforma;</li>
          <li>Utilizar os módulos de IA para gerar conteúdo ofensivo, difamatório ou ilegal;</li>
          <li>Sobrecarregar deliberadamente a infraestrutura da Plataforma (ataques de negação de serviço, varreduras automatizadas não autorizadas, entre outros).</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">5. Propriedade dos dados</h2>
        <p>
          Todos os dados inseridos pelo Usuário na Plataforma (processos, clientes,
          documentos, registros financeiros) permanecem de propriedade exclusiva do
          Usuário/Escritório. A LexRun atua apenas como operadora desses dados, nos termos
          da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), conforme detalhado em
          nossa <a href="/politica-de-privacidade" className="text-accent-600 hover:underline">Política de Privacidade</a>.
          Em caso de cancelamento da assinatura, o Usuário poderá solicitar a exportação
          de seus dados dentro do prazo de retenção informado na Política de Privacidade.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">6. Integrações com terceiros</h2>
        <p>
          A Plataforma permite a conexão com serviços de terceiros (Mercado Pago, provedores
          de WhatsApp, provedores de inteligência artificial como OpenAI e Anthropic). O uso
          dessas integrações está sujeito também aos termos de uso e políticas de privacidade
          de cada um desses provedores, sobre os quais a LexRun não exerce controle direto.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">7. Limitação de responsabilidade</h2>
        <p>
          A Plataforma é uma ferramenta de apoio à gestão e não substitui o julgamento
          técnico-jurídico do profissional habilitado. A LexRun não se responsabiliza por
          decisões, peças, prazos ou estratégias adotadas com base no uso da Plataforma,
          incluindo conteúdo gerado pelos módulos de inteligência artificial, cuja revisão
          pelo profissional responsável é sempre necessária antes de qualquer uso prático
          ou protocolo. A LexRun também não se responsabiliza por indisponibilidades
          decorrentes de falhas em serviços de terceiros (provedores de internet, serviços
          de e-mail, gateways de pagamento) fora de seu controle direto.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">8. Suspensão e rescisão</h2>
        <p>
          A LexRun poderá suspender ou encerrar o acesso à Plataforma em caso de
          inadimplência, violação destes Termos, ou uso que represente risco à segurança
          da Plataforma ou de outros usuários, mediante notificação prévia por e-mail
          sempre que viável.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">9. Alterações destes Termos</h2>
        <p>
          Estes Termos podem ser atualizados periodicamente. Alterações relevantes serão
          comunicadas por e-mail ou aviso na própria Plataforma, com antecedência razoável
          antes de sua entrada em vigor.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">10. Foro e legislação aplicável</h2>
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica
          eleito o foro do domicílio do Usuário para dirimir quaisquer controvérsias
          decorrentes destes Termos, conforme assegurado pelo Código de Defesa do
          Consumidor.
        </p>
      </section>

      <p className="text-xs text-brand-900/40 pt-4">
        Dúvidas sobre estes Termos podem ser enviadas para{' '}
        <a href="mailto:contato@lexrun.com.br" className="text-accent-600 hover:underline">contato@lexrun.com.br</a>.
      </p>
    </LegalLayout>
  )
}
