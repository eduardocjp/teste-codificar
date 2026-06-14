# Sistema de Chamados Internos

MVP em Next.js para cadastro, acompanhamento e distribuição de chamados internos.

O fluxo principal é o cadastro manual de chamados. O Intent Solver é um diferencial para sugerir título, assunto, setor, prioridade e intenção a partir da descrição informada pelo usuário.

## Funcionalidades

- Página pública e login.
- Sessão opaca em cookie HTTP-only.
- Perfis `ADMINISTRADOR` e `ATENDENTE`.
- CRUD base de chamados: criar, listar, visualizar e editar.
- Busca, filtros e ordenação de chamados.
- Atendentes por setor.
- Atribuição manual com validação de setor/perfil/ativo.
- Distribuição automática por menor carga ativa.
- Intent Solver determinístico com palavras-chave, exemplos e Fuse.js.
- Simulador do Intent Solver.
- Dashboard com indicadores e carga por atendente.
- Evolution API opcional com configuração administrativa, QR Code com rate limit, webhook, criação automática de chamados e envio de protocolo por cron.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript estrito
- Tailwind CSS 4
- Prisma 7 com `@prisma/adapter-pg`
- PostgreSQL no Supabase
- Zod
- Fuse.js
- Vitest
- shadcn/ui em `web/views/ui`

## Arquitetura

```text
Navegador
  -> Next.js na Vercel
  -> Prisma
  -> Supabase PostgreSQL
```

O Supabase é usado apenas como PostgreSQL. Não há Supabase Client, Supabase Auth ou acesso ao banco pelo navegador.

A Evolution API roda separadamente em uma VPS com Docker, PostgreSQL próprio e Redis próprio. O banco da Evolution não deve ser compartilhado com o banco da aplicação.

## Variáveis

Copie `.env.example` para `.env` e preencha:

```env
DATABASE_URL=""
DIRECT_URL=""
SESSAO_NOME_COOKIE="sessao_chamados"
SESSAO_DURACAO_HORAS="8"
NEXT_PUBLIC_NOME_APLICACAO="Sistema de Chamados"
PROVEDOR_MENSAGENS="simulador"
EVOLUTION_API_HABILITADA="false"
EVOLUTION_API_URL=""
EVOLUTION_API_CHAVE=""
EVOLUTION_API_INSTANCIA="teste_cod_01"
EVOLUTION_WEBHOOK_SEGREDO=""
EVOLUTION_WEBHOOK_URL="https://teste-codificar.vercel.app/api/evolution/webhook"
CRON_SECRET=""
```

`DATABASE_URL` é usada pelo Prisma Client em runtime.

`DIRECT_URL` é usada pelo Prisma CLI para migrations e seed.

As variáveis da Evolution são opcionais enquanto `EVOLUTION_API_HABILITADA="false"`. Quando habilitada, a área Admin usa esses valores para criar a instância `teste_cod_01`, configurar o webhook e gerar o QR Code. `CRON_SECRET` protege a rota que envia confirmações pendentes de protocolo.

## Banco e Prisma

Gerar client:

```bash
npm run prisma:generate
```

Criar/aplicar migration em desenvolvimento:

```bash
npm run db:migrate -- --name init
```

Aplicar migrations em produção:

```bash
npm run db:deploy
```

Executar seed:

```bash
npm run db:seed
```

Usuários criados pelo seed:

- `admin@empresa.com` / `admin123`
- `ana@empresa.com` / `atendente123`
- `bruno@empresa.com` / `atendente123`
- `carla@empresa.com` / `atendente123`
- `diego@empresa.com` / `atendente123`

## Desenvolvimento local

```bash
npm install
npm run prisma:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

A aplicação abre em:

```text
http://localhost:3000
```

## Testes e validação

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Testes atuais:

- Intent Solver.
- Ordenação da distribuição automática.
- Schema de criação de chamado.
- Configuração, parser, QR Code e fluxo automático do WhatsApp com mocks.

## Distribuição automática

Chamados ativos são:

- `ABERTO`
- `EM_ANDAMENTO`

A regra seleciona:

1. atendentes ativos do setor;
2. menor quantidade de chamados ativos;
3. quem nunca recebeu atribuição;
4. última atribuição mais antiga;
5. menor ID como desempate final.

Quando não há atendente disponível, o chamado permanece sem responsável para atribuição posterior.

## Intent Solver

O solver é local e determinístico. Ele combina:

- palavras-chave;
- exemplos;
- normalização de acentos, pontuação e caixa;
- Fuse.js para busca aproximada;
- fallback para o setor de Triagem.

A análise preenche sugestões, mas não salva o chamado automaticamente.

## Deploy na Vercel

Configure na Vercel:

- `DATABASE_URL`
- `DIRECT_URL`
- `SESSAO_NOME_COOKIE`
- `SESSAO_DURACAO_HORAS`
- `NEXT_PUBLIC_NOME_APLICACAO`
- `PROVEDOR_MENSAGENS`
- variáveis da Evolution apenas quando a integração estiver habilitada:
  - `EVOLUTION_API_HABILITADA`
  - `EVOLUTION_API_URL`
  - `EVOLUTION_API_CHAVE`
  - `EVOLUTION_API_INSTANCIA`
  - `EVOLUTION_WEBHOOK_SEGREDO`
  - `EVOLUTION_WEBHOOK_URL`

O script de build executa:

```bash
prisma generate && next build
```

Não execute Docker, PostgreSQL local ou Redis na Vercel.

## WhatsApp via Evolution API

A área Admin possui o botão `Configurar WhatsApp`. O modal permite:

- ativar ou desativar a automação sem desconectar a instância;
- configurar número opcional de aviso interno;
- configurar a mensagem de primeiro contato;
- abrir o QR Code de conexão;
- desconectar a instância com confirmação.

Desativar a automação não desconecta o WhatsApp. Enquanto desativada, a aplicação não responde mensagens automaticamente e não cria chamados por WhatsApp.

Ao conectar, o sistema:

1. usa `EVOLUTION_API_URL` e `EVOLUTION_API_CHAVE`;
2. cria a instância única `EVOLUTION_API_INSTANCIA` ou `teste_cod_01`;
3. configura o webhook em `EVOLUTION_WEBHOOK_URL`;
4. solicita o QR Code real da Evolution;
5. exibe o QR Code por até 30 segundos;
6. bloqueia nova solicitação de QR Code por 60 segundos no servidor.

Ao clicar em desconectar, o sistema exclui a instância na Evolution API. Não há tentativa automática de reconexão.

O webhook oficial configurado no `.env.example` é:

```text
/api/evolution/webhook
```

A rota `/api/webhook/evolution` também permanece disponível como compatibilidade.

### Fluxo automático de atendimento

Quando uma mensagem chega pelo webhook:

1. o webhook valida o segredo configurado;
2. mensagens duplicadas são ignoradas pelo identificador externo;
3. primeiro contato cria uma sessão e envia a orientação estruturada;
4. a segunda mensagem precisa conter nome, assunto e descrição por linha;
5. o Intent Solver é executado com assunto e descrição;
6. o chamado é criado com origem `WHATSAPP` e distribuição automática;
7. um aviso opcional é enviado uma única vez para o número de suporte;
8. o protocolo é agendado para envio após dois minutos.

O envio do protocolo não usa `setTimeout`. Ele é processado por:

```text
POST /api/cron/whatsapp
```

Essa rota deve receber `x-cron-secret` ou `Authorization: Bearer <CRON_SECRET>`. Ela pode ser chamada por Vercel Cron ou por rotina externa da VPS.

## Limitações do MVP

- Exclusão de chamados não foi priorizada.
- A distribuição automática usa transação na atribuição, mas a criação + seleção pode receber reforços futuros para concorrência intensa.
- A integração com Evolution depende da VPS e das variáveis reais em produção; os testes automatizados usam mocks e não dependem da instância real.

## Bibliotecas externas

Todas as bibliotecas usadas já estavam previstas na stack do projeto. Nenhuma biblioteca nova foi adicionada.
