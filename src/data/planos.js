// Fonte única da verdade para a vitrine de planos (features e público-alvo).
// Usada tanto na aba Planos do dashboard quanto na landing page pública —
// assim os dois nunca ficam dessincronizados (mudou aqui, muda nos dois).
// O preço real continua vindo da Stripe via backend; aqui é só vitrine.

export const FEATURES_POR_PLANO = {
  basico: [
    { label: '1 usuário',                          ok: true  },
    { label: 'Até 100 processos ativos',           ok: true  },
    { label: 'Kanban jurídico por fase do trâmite', ok: true  },
    { label: 'Cadastro de clientes e processos',    ok: true  },
    { label: 'Agenda com prazos e audiências',       ok: true  },
    { label: 'Portal do cliente (acompanhamento)',   ok: true  },
    { label: 'Geração de documentos por modelo',     ok: true  },
    { label: 'IA de documentos (10 gerações/mês)',   ok: true  },
    { label: 'Módulo financeiro completo',           ok: false },
    { label: 'Cobranças automáticas (Pix/boleto)',   ok: false },
    { label: 'Envio de documentos por WhatsApp',      emBreve: true },
    { label: 'Relatórios e exportação de dados',     ok: false },
    { label: 'Domínio próprio (white-label)',         ok: false },
    { label: 'Suporte prioritário',                   ok: false },
  ],
  professional: [
    { label: 'Até 5 usuários',                       ok: true  },
    { label: 'Processos ilimitados',                 ok: true  },
    { label: 'Kanban jurídico por fase do trâmite',  ok: true  },
    { label: 'Cadastro de clientes e processos',     ok: true  },
    { label: 'Agenda com prazos e audiências',        ok: true  },
    { label: 'Portal do cliente (acompanhamento)',    ok: true  },
    { label: 'Geração de documentos por modelo',      ok: true  },
    { label: 'IA de documentos (100 gerações/mês)',   ok: true  },
    { label: 'Módulo financeiro completo',            ok: true  },
    { label: 'Cobranças automáticas (Pix/boleto)',    ok: true  },
    { label: 'Envio de documentos por WhatsApp',       emBreve: true },
    { label: 'Relatórios e exportação de dados',      ok: true  },
    { label: 'Domínio próprio (white-label)',          ok: false },
    { label: 'Suporte prioritário',                    ok: false },
  ],
  banca: [
    { label: 'Usuários ilimitados',                  ok: true  },
    { label: 'Processos ilimitados',                  ok: true  },
    { label: 'Kanban jurídico por fase do trâmite',   ok: true  },
    { label: 'Cadastro de clientes e processos',      ok: true  },
    { label: 'Agenda com prazos e audiências',         ok: true  },
    { label: 'Portal do cliente (acompanhamento)',     ok: true  },
    { label: 'Geração de documentos por modelo',       ok: true  },
    { label: 'IA de documentos (gerações ilimitadas)', ok: true  },
    { label: 'Módulo financeiro completo',             ok: true  },
    { label: 'Cobranças automáticas (Pix/boleto)',     ok: true  },
    { label: 'Envio de documentos por WhatsApp',        emBreve: true },
    { label: 'Relatórios e exportação de dados',       ok: true  },
    { label: 'Domínio próprio (white-label)',           ok: true  },
    { label: 'Suporte prioritário com atendimento dedicado', ok: true },
  ],
}

export const PUBLICO_POR_PLANO = {
  basico: 'Advogados autônomos e recém-formados',
  professional: 'Pequenos e médios escritórios',
  banca: 'Grandes bancas e escritórios consolidados',
}
