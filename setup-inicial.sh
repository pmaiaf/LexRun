#!/bin/bash
# ============================================================
#  setup-inicial.sh — RODE UMA VEZ SÓ, na pasta jurisflow OU jurisflow-api
#  Configura o repositório git permanente (init + remote + branch).
#  Depois disso, você nunca mais precisa rodar isto — só o deploy.sh.
# ============================================================

set -e

echo "Qual repositório é esta pasta?"
echo "  1) Frontend (jurisflow)   → github.com/pmaiaf/LexRun"
echo "  2) API      (jurisflow-api) → github.com/pmaiaf/LexRun-Api"
read -p "Digite 1 ou 2: " OPCAO

if [ "$OPCAO" = "1" ]; then
  URL="https://github.com/pmaiaf/LexRun.git"
elif [ "$OPCAO" = "2" ]; then
  URL="https://github.com/pmaiaf/LexRun-Api.git"
else
  echo "❌ Opção inválida. Rode de novo e digite 1 ou 2."
  exit 1
fi

# Inicializa git se ainda não existe
if [ ! -d ".git" ]; then
  git init
fi

git branch -M main

# Configura o remote (set-url se já existe, add se não)
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$URL"
else
  git remote add origin "$URL"
fi

echo ""
echo "✅ Pasta configurada para: $URL"
echo "   A partir de agora, use apenas:  ./deploy.sh \"sua mensagem\""
echo ""
echo "⚠️  IMPORTANTE: NÃO apague esta pasta. Ela é permanente."
echo "   Quando vier uma versão nova, só substitua os arquivos alterados aqui dentro."
