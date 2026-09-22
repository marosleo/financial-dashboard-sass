# Nexo

Nexo reúne contas bancárias, movimentações e análises financeiras em uma experiência única. A conexão com instituições brasileiras acontece por Open Finance, com sincronização de saldos e transações, histórico mensal e insights sobre hábitos de consumo.

## Funcionalidades

- Cadastro e acesso seguro com Supabase Auth.
- Isolamento dos dados financeiros por usuário.
- Conexão bancária pelo Pluggy Connect.
- Sincronização idempotente de contas e transações.
- Visão mensal de saldo, entradas, saídas e fluxo de caixa.
- Busca, filtros e paginação no histórico de transações.
- Distribuição dos gastos por categoria.
- Insights em português gerados pelo Gemini, com análise local disponível durante indisponibilidades temporárias do provedor.
- Tema escuro e claro, com navegação responsiva.
- Webhooks do Pluggy com proteção contra eventos duplicados.

## Desenvolvimento local

O projeto usa Next.js e Material UI na aplicação web, NestJS na API, PostgreSQL com Prisma para persistência e contratos TypeScript compartilhados entre as aplicações.

Requisitos:

- Node.js 22 ou superior
- Docker com Docker Compose
- Uma conta Supabase
- Uma aplicação Pluggy
- Uma chave do Gemini para os insights gerados por IA

Crie o arquivo `.env` a partir de [.env.example](./.env.example) e preencha as credenciais necessárias.

```bash
npm install
npm run setup
npm run dev
```

A aplicação web fica disponível em `http://localhost:3002` e a API em `http://localhost:3001`. O PostgreSQL local usa a porta `5433`.

O comando `npm run setup` inicia o banco, aplica as migrações, cadastra as categorias padrão e compila os contratos compartilhados. Ele pode ser executado novamente sem apagar contas ou transações existentes.

## Variáveis de ambiente

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/financial_dashboard?schema=public"
NEXT_PUBLIC_API_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3002"
PORT="3001"

NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sua-chave-publicavel"

GEMINI_API_KEY=""
GEMINI_MODEL="gemini-3.6-flash"

PLUGGY_CLIENT_ID=""
PLUGGY_CLIENT_SECRET=""
PLUGGY_WEBHOOK_URL=""
PLUGGY_WEBHOOK_SECRET=""
```

As chaves publicáveis do Supabase podem ser expostas no navegador. Não use a secret key ou a service role key no frontend.

## Open Finance

1. Crie uma aplicação no painel da Pluggy.
2. Preencha `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`.
3. Inicie o Nexo e selecione **Conectar instituição**.
4. Em desenvolvimento, valide o fluxo com uma instituição sandbox antes de usar uma conta real.

O retorno do widget sincroniza os dados imediatamente, então o desenvolvimento local funciona sem uma URL pública. Em produção, configure um endpoint HTTPS:

```env
PLUGGY_WEBHOOK_URL="https://api.exemplo.com/api/pluggy/webhooks"
PLUGGY_WEBHOOK_SECRET="use-um-segredo-aleatorio-com-pelo-menos-32-caracteres"
```

O backend registra o webhook com um header secreto. IDs de eventos, contas e transações têm restrições únicas no banco para que reenvios sejam processados com segurança.

## Verificação

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Rotas principais da API

- `GET /api/health`
- `GET /api/auth/me`
- `GET /api/accounts`
- `GET /api/transactions`
- `GET /api/dashboard`
- `GET /api/insights`
- `POST /api/insights/generate`
- `GET /api/pluggy/status`
- `POST /api/pluggy/connect-token`
- `POST /api/pluggy/items/:itemId/sync`
- `POST /api/pluggy/connections/:connectionId/sync`
- `POST /api/pluggy/connections/:connectionId/connect-token`
- `DELETE /api/pluggy/connections/:connectionId`
- `POST /api/pluggy/webhooks`
