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
- Evolution API preparada como integração opcional e desabilitada por padrão.

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

A Evolution API, quando implementada, deve rodar separadamente em uma VPS com Docker, PostgreSQL próprio e Redis próprio. O banco da Evolution não deve ser compartilhado com o banco da aplicação.

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
```

`DATABASE_URL` é usada pelo Prisma Client em runtime.

`DIRECT_URL` é usada pelo Prisma CLI para migrations e seed.

As variáveis da Evolution são opcionais enquanto `EVOLUTION_API_HABILITADA="false"`.

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
- variáveis da Evolution apenas quando a integração estiver habilitada

O script de build executa:

```bash
prisma generate && next build
```

Não execute Docker, PostgreSQL local ou Redis na Vercel.

## Evolution API

A rota `/api/webhook/evolution` existe, mas retorna desabilitada por padrão.

A integração real deve validar segredo, idempotência e payload antes de criar conversas/chamados. Nenhuma credencial da Evolution é necessária para avaliar o núcleo do sistema.

## Limitações do MVP

- Exclusão de chamados não foi priorizada.
- CRUD visual completo de intenções/atendentes ainda pode ser expandido.
- A distribuição automática usa transação na atribuição, mas a criação + seleção pode receber reforços futuros para concorrência intensa.
- A Evolution API está intencionalmente desabilitada.

## Bibliotecas externas

Todas as bibliotecas usadas já estavam previstas na stack do projeto. Nenhuma biblioteca nova foi adicionada.
