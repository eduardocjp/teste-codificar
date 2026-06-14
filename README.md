# Sistema de Chamados Internos

Projeto de teste técnico para vaga de emprego. O sistema centraliza chamados internos, distribui automaticamente as demandas entre atendentes e permite abertura manual ou automática por canais de entrada.

Repositório público: [https://github.com/eduardocjp/teste-codificar](https://github.com/eduardocjp/teste-codificar)

## O que o sistema faz

- Login com perfis `ADMINISTRADOR` e `ATENDENTE`.
- Cadastro manual de chamados.
- Listagem, busca, filtros, detalhes e edição de chamados.
- Atribuição manual de responsável.
- Distribuição automática para o atendente ativo com menor carga no setor.
- Cadastro, edição, ativação e desativação de atendentes.
- Cadastro, edição, ativação, desativação e exclusão de intenções.
- Intent Solver determinístico para sugerir setor, prioridade, assunto e título.
- Simulador para testar mensagens de WhatsApp e estrutura futura de e-mail.
- Dashboard com indicadores e chamados recentes.
- Criação automática de chamados por WhatsApp via Evolution API.
- Estrutura técnica futura para entrada de chamados por e-mail inbound, ainda inativa.
- Registro de conversas associadas aos chamados.

## Perfis

`ADMINISTRADOR`:

- acessa dashboard global;
- cria e edita chamados;
- administra atendentes;
- configura intenções;
- conecta WhatsApp via Evolution;
- configura mensagens automáticas;
- consulta conversas e simulador.

`ATENDENTE`:

- acessa chamados permitidos;
- acompanha demandas atribuídas;
- atualiza informações do chamado conforme regras do sistema.

## Arquitetura

```text
Navegador
  -> Next.js na Vercel
  -> Prisma
  -> Supabase PostgreSQL
```

WhatsApp:

```text
WhatsApp
  -> Evolution API em Docker na VPS
  -> Webhook HTTPS na Vercel
  -> Prisma
  -> Supabase PostgreSQL
```

E-mail futuro:

```text
Caixa de suporte
  -> redirecionamento/inbound Postmark
  -> Webhook HTTPS na Vercel
  -> estrutura preparada
  -> implementação futura
```

O Supabase é usado somente como PostgreSQL. O acesso ao banco ocorre pelo Prisma no servidor. A Evolution API roda fora da Vercel, em VPS própria.

## Stack

- Next.js App Router
- React
- TypeScript estrito
- Tailwind CSS
- Prisma
- PostgreSQL no Supabase
- Zod
- Fuse.js
- Vitest
- shadcn/ui em `web/views/ui`

## Como fazer fork e clone

1. Acesse [https://github.com/eduardocjp/teste-codificar](https://github.com/eduardocjp/teste-codificar).
2. Clique em `Fork`.
3. Clone o seu fork:

```bash
git clone https://github.com/SEU_USUARIO/teste-codificar.git
cd teste-codificar
```

Para clonar diretamente o repositório original:

```bash
git clone https://github.com/eduardocjp/teste-codificar.git
cd teste-codificar
```

## Instalação local

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run db:deploy
npm run db:seed
npm run dev
```

A aplicação local fica em:

```text
http://localhost:3000
```

No Windows PowerShell, se preferir:

```powershell
Copy-Item .env.example .env
```

## Variáveis de ambiente

Use `.env.example` como base. O arquivo `.env` real não deve ser versionado.

Principais variáveis:

```env
DATABASE_URL=""
DIRECT_URL=""

SESSAO_NOME_COOKIE="sessao_chamados"
SESSAO_DURACAO_HORAS="8"
NEXT_PUBLIC_NOME_APLICACAO="Sistema de Chamados"

EVOLUTION_API_HABILITADA="false"
EVOLUTION_API_URL=""
EVOLUTION_API_CHAVE=""
EVOLUTION_API_INSTANCIA="teste_cod_01"
EVOLUTION_WEBHOOK_SEGREDO=""
EVOLUTION_WEBHOOK_URL="https://teste-codificar.vercel.app/api/evolution/webhook"
CRON_SECRET=""

EMAIL_ENTRADA_HABILITADA="false"
EMAIL_PROVEDOR="postmark"
POSTMARK_WEBHOOK_USUARIO=""
POSTMARK_WEBHOOK_SENHA=""
```

`DATABASE_URL` é usada pelo Prisma Client em runtime.

`DIRECT_URL` é usada pelo Prisma CLI para migrations, deploy de schema e seed.

`EVOLUTION_API_CHAVE`, `EVOLUTION_WEBHOOK_SEGREDO`, `CRON_SECRET` e credenciais Postmark devem existir apenas no `.env` local e nas variáveis da Vercel.

## Supabase

1. Crie um projeto no Supabase.
2. Use o PostgreSQL do Supabase como banco principal.
3. Copie a string de conexão para `DATABASE_URL`.
4. Copie a string adequada para CLI/migrations para `DIRECT_URL`.
5. Rode:

```bash
npm run db:deploy
npm run db:seed
```

O projeto não usa Supabase Client nem Supabase Auth.

## Prisma

Gerar client:

```bash
npm run prisma:generate
```

Aplicar migrations:

```bash
npm run db:deploy
```

Criar migration em desenvolvimento:

```bash
npm run db:migrate -- --name nome_da_migration
```

Abrir Prisma Studio:

```bash
npm run db:studio
```

## Vercel

O sistema está preparado para deploy na Vercel.

Passos:

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente em `Project Settings > Environment Variables`.
3. Configure `DATABASE_URL` e `DIRECT_URL`.
4. Configure variáveis da Evolution somente se for usar WhatsApp real.
5. Mantenha variáveis Postmark vazias enquanto a entrada de e-mail estiver inativa.
6. Faça o deploy.

O build roda:

```bash
prisma generate && next build
```

Depois de alterar variáveis na Vercel, faça novo deploy para aplicar.

## Usuários de demonstração

O seed cria usuários para avaliação:

- `admin@empresa.com` / `admin123`
- `ana@empresa.com` / `atendente123`
- `bruno@empresa.com` / `atendente123`
- `carla@empresa.com` / `atendente123`
- `diego@empresa.com` / `atendente123`

Troque essas senhas antes de qualquer uso real.

## Distribuição automática

Chamados ativos:

- `ABERTO`
- `EM_ANDAMENTO`

Regra:

1. identifica o setor;
2. lista atendentes ativos do setor;
3. conta chamados ativos de cada atendente;
4. seleciona menor carga;
5. desempata por última atribuição mais antiga;
6. persiste a atribuição.

Se não houver atendente disponível, o chamado fica sem responsável para atribuição posterior.

## Intent Solver

O Intent Solver é local e determinístico. Ele usa:

- intenções cadastradas no banco;
- palavras-chave;
- exemplos;
- normalização de acentos e caixa;
- Fuse.js para busca aproximada;
- fallback para Triagem.

Ele sugere campos, mas o usuário ainda pode criar chamado manualmente.

## WhatsApp via Evolution

Na área Admin, o botão `Configurar WhatsApp` permite:

- ativar/desativar automação;
- conectar via QR Code real retornado pela Evolution;
- consultar dinamicamente se a instância conectou;
- desconectar excluindo a instância na Evolution;
- configurar número de aviso interno;
- configurar a mensagem de primeiro contato;
- configurar a mensagem de confirmação do chamado.

Fluxo:

1. admin clica em conectar;
2. o sistema cria ou conecta a instância `teste_cod_01` na Evolution;
3. o webhook é configurado para `EVOLUTION_WEBHOOK_URL`;
4. o QR Code é exibido;
5. quando o cliente envia mensagem ao suporte, o webhook recebe a mensagem;
6. o sistema responde pedindo uma estrutura com nome, assunto e descrição;
7. a resposta correta é analisada pelo Intent Solver;
8. o chamado é criado com origem `WHATSAPP`;
9. o sistema distribui automaticamente;
10. o número reserva, se configurado, recebe aviso de que há cliente aguardando suporte;
11. o protocolo é enviado ao cliente por rotina protegida.

Mensagem padrão solicitada ao cliente:

```text
Copie essa mensagem e responda com ela no corpo.

Descreva seu problema desta forma, em uma única mensagem:
------------
Informe seu nome:
Assunto:
Descrição do problema:
------------
```

O envio do protocolo usa:

```text
POST /api/cron/whatsapp
```

Essa rota exige `x-cron-secret` ou `Authorization: Bearer <CRON_SECRET>`.

## E-mail inbound futuro

O sistema possui estrutura preparada para uma implementação futura de redirecionamento inbound por e-mail via Postmark:

```text
POST /api/webhook/email/postmark
```

Estado atual:

- `EMAIL_ENTRADA_HABILITADA="false"` mantém a rota inativa e retorna `503`.
- `EMAIL_ENTRADA_HABILITADA="true"` ainda retorna `501`, pois a criação de chamados por e-mail não deve ser considerada pronta nesta etapa.
- As funções de schema, adaptação e autenticação Basic existem para facilitar a próxima etapa.

Quando a implementação futura for ativada, a rota deverá exigir Basic Auth com:

```env
POSTMARK_WEBHOOK_USUARIO=""
POSTMARK_WEBHOOK_SENHA=""
```

Fluxo planejado:

1. a caixa de suporte redireciona a mensagem para o provedor inbound;
2. o Postmark chama o webhook da aplicação;
3. o sistema valida autenticação e payload;
4. mensagens automáticas/listas são ignoradas;
5. assunto e corpo são combinados;
6. o Intent Solver define setor, prioridade e intenção;
7. o chamado será criado com origem `EMAIL`;
8. a distribuição automática selecionará o atendente.

No estado atual, nenhum e-mail recebido cria chamado.

## Testes

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Coberturas atuais:

- autenticação e segurança básica;
- schemas e validações;
- Intent Solver;
- distribuição automática;
- chamados;
- responsáveis;
- WhatsApp/Evolution com mocks;
- estrutura futura de e-mail/Postmark com mocks;
- componentes compartilhados.

## Segurança para repositório público

- `.env` é ignorado pelo Git.
- `.env.example` contém placeholders.
- segredos não devem usar prefixo `NEXT_PUBLIC_`.
- cookies de sessão são HTTP-only.
- tokens de sessão são salvos com hash SHA-256.
- senhas são salvas com hash `scrypt`.
- webhooks usam segredo ou Basic Auth.
- rotas administrativas validam sessão e perfil.

Antes de publicar para uso real, troque credenciais do seed e configure segredos reais apenas na Vercel.

## Limitações

- E-mail inbound permanece inativo e documentado como plano futuro.
- Anexos de e-mail ainda não são armazenados.
- WhatsApp depende da Evolution API em VPS separada.
- A rotina de protocolo do WhatsApp depende de cron externo/Vercel Cron.
- Não há chat em tempo real.

## Bibliotecas

Nenhuma biblioteca nova foi adicionada nesta etapa. O projeto usa as dependências já presentes no repositório.
