#!/bin/bash
# ============================================================
#  deploy.sh — LexRun (rode de dentro da pasta jurisflow OU jurisflow-api)
#  Detecta sozinho qual repositório é, faz add + commit + push.
#  Uso:  ./deploy.sh "mensagem do commit"
#  Se não passar mensagem, usa data/hora automática.
# ============================================================

set -e  # para na primeira falha

# Mensagem do commit (argumento, ou data/hora se vazio)
MSG="${1:-Atualização $(date '+%d/%m/%Y %H:%M')}"

# Confirma que estamos num repositório git já configurado
if [ ! -d ".git" ]; then
  echo "❌ Esta pasta não é um repositório git (.git não encontrado)."
  echo "   Você está na pasta certa? Rode o setup inicial primeiro (ver GUIA-SETUP.md)."
  exit 1
fi

echo "📦 Repositório: $(git remote get-url origin 2>/dev/null || echo 'sem remote!')"
echo "📝 Commit: $MSG"
echo ""

git add .

# Se não há nada para commitar, avisa e sai sem erro
if git diff --cached --quiet; then
  echo "ℹ️  Nenhuma alteração para enviar (tudo já está sincronizado)."
  exit 0
fi

git commit -m "$MSG"
git push

echo ""
echo "✅ Enviado com sucesso! O Vercel/Railway vai redeployar automaticamente."
