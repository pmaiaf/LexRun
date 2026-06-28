import LegalLayout from './LegalLayout.jsx'

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout titulo="Política de Privacidade" atualizadoEm="17 de junho de 2026">
      <p>
        Esta Política de Privacidade descreve como a <strong>LexRun</strong>{' '}
        ("LexRun", "nós") coleta,
        utiliza, armazena e protege os dados pessoais tratados por meio da plataforma LexRun,
        em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
      </p>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">1. Papéis no tratamento de dados</h2>
        <p>
          Para os dados do escritório contratante (nome, e-mail, OAB, dados de pagamento), a
          LexRun atua como <strong>controladora</strong>. Para os dados inseridos pelo
          escritório referentes a seus próprios clientes (nomes, processos, documentos), a
          LexRun atua como <strong>operadora</strong>, processando esses dados exclusivamente
          conforme as instruções do escritório, que permanece como controlador desses dados.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">2. Dados que coletamos</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Dados de cadastro:</strong> nome, e-mail, número de OAB e nome do escritório;</li>
          <li><strong>Dados de pagamento:</strong> processados diretamente pela Stripe — a LexRun não armazena números completos de cartão de crédito;</li>
          <li><strong>Dados de uso:</strong> registros de acesso, ações realizadas na Plataforma e dados técnicos (endereço IP, tipo de navegador), usados para segurança e melhoria do serviço;</li>
          <li><strong>Dados inseridos pelo escritório:</strong> informações de clientes, processos, documentos e registros financeiros cadastrados voluntariamente na Plataforma.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">3. Finalidade do tratamento</h2>
        <p>
          Os dados coletados são utilizados para: viabilizar o funcionamento da Plataforma e
          suas funcionalidades; processar pagamentos e gerenciar assinaturas; enviar
          comunicações operacionais essenciais (confirmação de cadastro, dados de acesso,
          avisos de cobrança); oferecer suporte técnico; e cumprir obrigações legais ou
          regulatórias aplicáveis.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">4. Compartilhamento com terceiros</h2>
        <p>
          Os dados podem ser compartilhados com prestadores de serviço estritamente
          necessários à operação da Plataforma, entre eles:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Stripe</strong> — processamento de pagamentos da assinatura;</li>
          <li><strong>SendGrid</strong> (ou provedor de e-mail equivalente) — envio de e-mails transacionais;</li>
          <li><strong>Mercado Pago</strong> — quando o próprio escritório conecta sua conta para cobrar seus clientes finais;</li>
          <li><strong>Provedores de inteligência artificial</strong> (como OpenAI ou Anthropic) — quando o escritório utiliza os módulos de geração de documentos por IA;</li>
          <li><strong>Provedores de WhatsApp</strong> — quando o escritório opta por enviar documentos ou cobranças via WhatsApp.</li>
        </ul>
        <p>
          A LexRun não vende dados pessoais a terceiros para fins de publicidade.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">5. Retenção e exclusão de dados</h2>
        <p>
          Os dados são mantidos enquanto a conta estiver ativa. Após o cancelamento da
          assinatura, os dados permanecem armazenados por até 90 dias, prazo durante o qual
          o escritório pode solicitar a exportação completa de suas informações. Após esse
          período, os dados são excluídos de forma definitiva, exceto aqueles cuja retenção
          seja exigida por lei (como registros fiscais).
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">6. Direitos do titular</h2>
        <p>Nos termos da LGPD, o titular dos dados pode solicitar, a qualquer momento:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Confirmação da existência de tratamento de seus dados;</li>
          <li>Acesso e correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
          <li>Eliminação dos dados tratados, quando aplicável;</li>
          <li>Informação sobre as entidades com as quais os dados foram compartilhados.</li>
        </ul>
        <p>
          Solicitações podem ser feitas pelo e-mail{' '}
          <a href="mailto:privacidade@lexrun.com.br" className="text-accent-600 hover:underline">privacidade@lexrun.com.br</a>.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">7. Segurança da informação</h2>
        <p>
          A LexRun adota medidas técnicas e organizacionais razoáveis para proteger os dados
          armazenados, incluindo isolamento lógico entre escritórios (arquitetura
          multi-tenant), criptografia de senhas e controle de acesso por autenticação.
          Nenhum sistema é absolutamente livre de risco, e a LexRun se compromete a notificar
          os usuários afetados em caso de incidente de segurança relevante, conforme exigido
          pela LGPD.
        </p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-xl text-brand-900 mb-2">8. Alterações desta Política</h2>
        <p>
          Esta Política pode ser atualizada periodicamente para refletir mudanças legais ou
          operacionais. A versão vigente estará sempre disponível nesta página, com a data
          da última atualização indicada no topo.
        </p>
      </section>

      <p className="text-xs text-brand-900/40 pt-4">
        Dúvidas sobre esta Política podem ser enviadas para{' '}
        <a href="mailto:privacidade@lexrun.com.br" className="text-accent-600 hover:underline">privacidade@lexrun.com.br</a>.
      </p>
    </LegalLayout>
  )
}
