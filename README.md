# Sistema de Chamados Internos

Projeto desenvolvido para um desafio técnico de vaga Full Stack.

A aplicação centraliza solicitações internas, permite o acompanhamento dos chamados e distribui automaticamente as demandas entre os atendentes disponíveis.

## Demonstração

* **Aplicação:** https://teste-codificar.vercel.app
* **Repositório:** https://github.com/eduardocjp/teste-codificar

### Acesso de demonstração

* **E-mail:** `admin@empresa.com`
* **Senha:** `admin123`

> As credenciais acima são destinadas exclusivamente à demonstração. Elas devem ser substituídas antes de qualquer uso real.

---

## Como avaliar rapidamente

1. Acesse a aplicação publicada.
2. Entre com `admin@empresa.com` e `admin123`.
3. Acesse a página **Chamados**.
4. Clique em **Novo chamado**.
5. Informe a solicitação: `Meu computador travou e não inicia`.
6. Execute o Intent Solver.
7. Confira as sugestões de setor, prioridade, assunto e título.
8. Escolha a atribuição automática.
9. Confirme o cadastro.
10. Verifique o responsável selecionado.
11. Abra os detalhes do chamado.
12. Altere o status para `EM_ANDAMENTO` ou `RESOLVIDO`.

### Avaliação da integração com WhatsApp

13. Acesse a página **Admin**.
14. Clique em **Configurar WhatsApp**.
15. Ative a automação, caso esteja desativada.
16. Clique em **Conectar**.
17. Leia o QR Code utilizando o WhatsApp que será usado como número de suporte.
18. Aguarde o sistema confirmar que a instância foi conectada.
19. Utilizando outro número de WhatsApp, envie uma mensagem para o número conectado ao suporte.
20. O bot responderá solicitando que a demanda seja enviada em uma única mensagem, seguindo esta estrutura:

```
Informe seu nome:
Assunto:
Descrição do problema:
```

21. Responda seguindo o formato solicitado. Exemplo:

```
Informe seu nome: João da Silva
Assunto: Computador não liga
Descrição do problema: Após uma queda de energia, o computador parou de ligar.
```

22. Caso algum campo esteja ausente ou a mensagem não siga a estrutura esperada, o bot solicitará o envio novamente no formato correto.
23. Quando a mensagem estiver válida, o sistema irá:

    * identificar o nome, o assunto e a descrição;
    * executar o Intent Solver;
    * identificar o setor e a prioridade;
    * criar automaticamente um chamado com origem `WHATSAPP`;
    * distribuir o chamado para o atendente ativo com menor carga no setor;
    * registrar a conversa associada ao chamado.
24. Após o processamento, o cliente receberá uma mensagem de confirmação contendo o protocolo do chamado.
25. Acesse novamente a página **Chamados** e localize o registro criado pelo WhatsApp.
26. Abra os detalhes e verifique:

    * protocolo;
    * origem `WHATSAPP`;
    * nome e telefone do solicitante;
    * assunto;
    * descrição;
    * intenção identificada;
    * setor;
    * prioridade;
    * responsável selecionado.
27. Caso um número interno de aviso esteja configurado, ele também receberá uma notificação informando que um novo chamado foi criado.

> A confirmação com o protocolo é enviada por uma rotina protegida. Por isso, pode existir um pequeno intervalo entre a criação do chamado e o recebimento da mensagem no WhatsApp.

> A integração com WhatsApp depende de uma instância válida da Evolution API, das variáveis de ambiente configuradas e da execução da rotina responsável pelo envio dos protocolos.


---

## Requisitos atendidos

O sistema contempla os principais requisitos do desafio:

* cadastro de chamados;
* edição de chamados;
* listagem de chamados;
* visualização dos detalhes;
* título e descrição;
* prioridades baixa, média e alta;
* status aberto, em andamento, resolvido e fechado;
* associação de responsável;
* data e hora de abertura;
* pelo menos três atendentes disponíveis;
* atribuição manual;
* distribuição automática;
* busca;
* filtros;
* ordenação;
* documentação de instalação e execução;
* testes das principais regras de negócio.

Além dos requisitos obrigatórios, foram implementados diferenciais como:

* autenticação;
* perfis de acesso;
* dashboard;
* cadastro de atendentes;
* Intent Solver;
* simulador;
* integração opcional com WhatsApp;
* preparação técnica para uma futura entrada por e-mail.

---

## O que o sistema faz

* Login com perfis `ADMINISTRADOR` e `ATENDENTE`.
* Cadastro manual de chamados.
* Listagem, busca, filtros, detalhes e edição de chamados.
* Atribuição manual de responsável.
* Distribuição automática para o atendente ativo com menor carga no setor.
* Cadastro, edição, ativação e desativação de atendentes.
* Cadastro, edição, ativação, desativação e exclusão de intenções.
* Intent Solver determinístico para sugerir setor, prioridade, assunto e título.
* Simulador para testar mensagens de WhatsApp e a estrutura futura de e-mail.
* Dashboard com indicadores e chamados recentes.
* Criação automática de chamados por WhatsApp via Evolution API.
* Estrutura técnica futura para entrada de chamados por e-mail inbound, ainda inativa.
* Registro de conversas associadas aos chamados.

---

## Perfis

### Administrador

O perfil `ADMINISTRADOR` pode:

* acessar o dashboard global;
* criar e editar chamados;
* visualizar os chamados do sistema;
* administrar atendentes;
* configurar intenções;
* conectar o WhatsApp via Evolution API;
* configurar mensagens automáticas;
* consultar conversas;
* utilizar o simulador;
* acessar configurações administrativas.

### Atendente

O perfil `ATENDENTE` pode:

* acessar o dashboard permitido;
* consultar chamados;
* acompanhar as demandas atribuídas;
* visualizar os detalhes;
* atualizar informações e status conforme as regras do sistema.

---

## Stack

* Next.js App Router
* React
* TypeScript estrito
* Tailwind CSS
* Prisma ORM
* PostgreSQL no Supabase
* Zod
* Fuse.js
* Vitest
* React Testing Library
* shadcn/ui e Radix UI
* Lucide React
* Sonner
* date-fns

---

## Justificativa das escolhas tecnológicas e arquiteturais

O enunciado permite a escolha livre da stack. Optei por Next.js e TypeScript por serem tecnologias com as quais possuo maior experiência prática, permitindo concentrar o tempo na arquitetura, nas regras de negócio, nos testes e na qualidade da entrega.

### Por que Next.js com TypeScript

Trabalho com Next.js e TypeScript no dia a dia, o que permitiu focar na qualidade da solução em vez de aprender uma nova ferramenta durante o prazo do desafio.

O TypeScript estrito identifica antecipadamente uma ampla classe de erros de tipagem, documenta os contratos entre as camadas e facilita a navegação pelo código.

Dados externos continuam sendo validados em tempo de execução com Zod, pois a tipagem do TypeScript não substitui a validação de formulários, requisições, webhooks e variáveis de ambiente.

### Por que um monolito leve em vez de uma API separada

O Next.js App Router permite que frontend e backend coexistam no mesmo repositório e no mesmo processo de deploy.

Route Handlers funcionam como endpoints de API e podem ser consumidos pela própria interface sem a necessidade de manter dois projetos separados.

Para um time pequeno, essa abordagem reduz o atrito:

* um único repositório;
* uma única linguagem;
* um único processo de build;
* um único deploy;
* tipos compartilhados;
* menor necessidade de sincronização entre frontend e backend.

A aplicação continua separada por responsabilidades, mesmo permanecendo em um monolito:

```text
Rota
  -> Controller ou View
  -> Serviço ou módulo de domínio
  -> Prisma
  -> PostgreSQL
```

### Por que Prisma com PostgreSQL

O Prisma fornece:

* acesso tipado ao banco;
* schema centralizado;
* migrations versionadas;
* geração automática de tipos;
* consultas mais legíveis;
* integração adequada com TypeScript.

As migrations ficam versionadas em SQL, permitindo reproduzir o estado do banco em outros ambientes.

O PostgreSQL foi escolhido por sua robustez e por representar bem as relações entre:

* usuários;
* setores;
* intenções;
* chamados;
* conversas;
* sessões.

### Por que Supabase

O Supabase é utilizado apenas como provedor gerenciado de PostgreSQL.

A aplicação não depende de Supabase Auth nem do Supabase Client para acessar as tabelas. Todo acesso aos dados da aplicação ocorre pelo Prisma no servidor.

Isso permite utilizar a infraestrutura gerenciada do Supabase sem acoplar as regras de negócio ao SDK da plataforma.

### Por que Vercel + Supabase

A combinação entre GitHub, Vercel e Supabase reduz a complexidade operacional da aplicação principal.

A Vercel automatiza os deployments a partir do repositório, enquanto o Supabase fornece uma instância gerenciada de PostgreSQL.

Ainda é necessário:

* configurar as variáveis de ambiente;
* configurar as conexões do banco;
* aplicar as migrations;
* executar o seed;
* validar o ambiente publicado.

Para demonstração e desenvolvimento, a aplicação principal pode operar dentro dos limites dos planos gratuitos disponíveis.

A integração opcional com WhatsApp utiliza uma Evolution API hospedada separadamente em uma VPS. Essa infraestrutura não é necessária para executar e avaliar o núcleo do sistema de chamados.

### Por que Zod para validação

O Zod valida os dados nas fronteiras do sistema:

* formulários;
* Route Handlers;
* parâmetros;
* filtros;
* webhooks;
* variáveis de ambiente.

Os schemas centralizam as regras dos dados e permitem inferir tipos TypeScript, reduzindo duplicações.

As mensagens de validação são padronizadas e convertidas em respostas consistentes para a interface.

### Por que Fuse.js no Intent Solver

O Fuse.js é utilizado como apoio para busca aproximada.

Ele permite reconhecer pequenas variações e erros de digitação sem depender de uma API de inteligência artificial generativa.

O Fuse.js não é a única regra do Intent Solver. A classificação também considera:

* palavras-chave;
* exemplos;
* correspondências exatas;
* normalização de acentos;
* confiança mínima;
* fallback para Triagem.

### Por que Vitest para testes

O Vitest oferece:

* execução rápida;
* bom suporte a TypeScript e ESM;
* configuração simples;
* mocks;
* testes unitários e de componentes.

Os testes cobrem utilitários, schemas, repositórios com Prisma mockado, serviços, controllers, componentes e integrações simuladas, sem depender de banco real ou credenciais externas.

### Sobre Laravel e a stack da Codificar

O enunciado menciona Laravel, Inertia.js e Vue.js como tecnologias utilizadas no dia a dia da Codificar.

Não utilizei Laravel porque ainda não possuo experiência prática suficiente com PHP e preferi entregar uma solução bem estruturada na stack que domino, em vez de desenvolver uma implementação superficial em uma tecnologia nova.

Tenho interesse em aprender Laravel caso a tecnologia faça parte do processo de onboarding e do trabalho da equipe.

---

## Arquitetura

### Aplicação principal

```text
Navegador
  -> Next.js na Vercel
  -> Prisma
  -> PostgreSQL no Supabase
```

### WhatsApp

```text
WhatsApp
  -> Evolution API em Docker na VPS
  -> Webhook HTTPS na Vercel
  -> Intent Solver
  -> Criação do chamado
  -> Prisma
  -> PostgreSQL no Supabase
```

### E-mail futuro

```text
Caixa de suporte
  -> encaminhamento para Postmark Inbound
  -> Webhook HTTPS na Vercel
  -> estrutura técnica preparada
  -> implementação futura
```

A Evolution API roda fora da Vercel, em uma VPS própria.

O banco interno utilizado pela Evolution API é independente do PostgreSQL da aplicação no Supabase.

---

## Organização do código

As rotas em `src/app` são mantidas pequenas e delegam responsabilidades para controllers, views, serviços e módulos.

```text
src/app
  -> rotas do Next.js

web/views
  -> interface

web/controllers
  -> entrada, validação e autorização

web/services
  -> coordenação entre domínios

web/modules
  -> regras específicas

web/messaging
  -> integrações de mensagens

web/lib
  -> Prisma, ambiente e infraestrutura

tests
  -> testes unitários e de componentes
```

Fluxo geral:

```text
src/app/.../route.ts ou page.tsx
    -> controller ou view
    -> service / module
    -> Prisma
    -> PostgreSQL no Supabase
```

---

## Pré-requisitos

O ambiente utilizado durante o desenvolvimento foi:

* Node.js `24.12.0`
* npm `11.6.2`

Também são necessários:

* Git;
* projeto PostgreSQL no Supabase;
* acesso de rede ao banco;
* variáveis de ambiente configuradas.

A Evolution API não é necessária para executar o núcleo do sistema.

---

## Como fazer fork e clone

1. Acesse:

```text
https://github.com/eduardocjp/teste-codificar
```

2. Clique em **Fork**.

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

---

## Instalação local

Instale as dependências:

```bash
npm install
```

Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Depois de configurar as variáveis:

```bash
npm run prisma:generate
npm run db:deploy
npm run db:seed
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:3000
```

---

## Variáveis de ambiente

Use `.env.example` como base.

O arquivo `.env` real não deve ser versionado.

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

### Banco

`DATABASE_URL` é utilizada pelo Prisma Client durante a execução da aplicação.

`DIRECT_URL` é utilizada pelo Prisma CLI para:

* migrations;
* deploy do schema;
* seed;
* Prisma Studio.

### Segurança

Estas variáveis devem permanecer privadas:

```text
DATABASE_URL
DIRECT_URL
EVOLUTION_API_CHAVE
EVOLUTION_WEBHOOK_SEGREDO
CRON_SECRET
POSTMARK_WEBHOOK_USUARIO
POSTMARK_WEBHOOK_SENHA
```

Não utilize o prefixo `NEXT_PUBLIC_` em segredos.

---

## Supabase

1. Crie um projeto no Supabase.
2. No painel do projeto, abra a opção **Connect**.
3. Para `DATABASE_URL`, utilize a conexão indicada para o runtime da aplicação, adequada ao ambiente serverless.
4. Para `DIRECT_URL`, utilize a conexão indicada para migrations e operações administrativas.
5. Caso a conexão direta não esteja disponível na sua rede, utilize a alternativa de sessão indicada pelo próprio painel.
6. Execute:

```bash
npm run db:deploy
npm run db:seed
```

O projeto não utiliza Supabase Auth.

O acesso às tabelas da aplicação ocorre pelo Prisma no servidor.

### Supabase Cron para protocolos do WhatsApp

O envio posterior do protocolo do chamado é agendado no Supabase, usando `pg_cron` e `pg_net`.

A migration `20260614220000_supabase_cron_whatsapp` cria:

* as extensões `pg_cron`, `pg_net` e `supabase_vault`;
* a função privada `private.disparar_cron_whatsapp()`;
* o job `teste_codificar_whatsapp_protocolos`, executado a cada 3 minutos.

Antes de depender do job em produção, cadastre estes segredos no **Supabase Vault**:

```sql
select vault.create_secret('https://teste-codificar.vercel.app', 'teste_codificar_app_url');
select vault.create_secret('MESMO_VALOR_DO_CRON_SECRET_DA_VERCEL', 'teste_codificar_cron_secret');
```

O valor `teste_codificar_cron_secret` deve ser igual ao `CRON_SECRET` configurado na Vercel.

O cron chama:

```text
POST https://teste-codificar.vercel.app/api/cron/whatsapp
Authorization: Bearer <CRON_SECRET>
```

Se os segredos ainda não existirem no Vault, a migration continua aplicável, mas o job falhará até que eles sejam configurados.

---

## Prisma

Gerar o Prisma Client:

```bash
npm run prisma:generate
```

Aplicar migrations existentes:

```bash
npm run db:deploy
```

Criar migration durante o desenvolvimento:

```bash
npm run db:migrate -- --name nome_da_migration
```

Executar o seed:

```bash
npm run db:seed
```

Abrir o Prisma Studio:

```bash
npm run db:studio
```

As migrations ficam versionadas em:

```text
prisma/migrations
```

---

## Vercel

A aplicação está preparada para deploy na Vercel.

### Passos

1. Importe o repositório na Vercel.
2. Configure as variáveis em:

```text
Project Settings
  -> Environment Variables
```

3. Configure `DATABASE_URL` e `DIRECT_URL`.
4. Configure as variáveis da Evolution apenas caso utilize o WhatsApp real.
5. Mantenha as variáveis do Postmark vazias enquanto a entrada por e-mail estiver inativa.
6. Faça o deploy.

O build executa:

```bash
prisma generate && next build
```

Depois de alterar variáveis na Vercel, faça um novo deployment.

O projeto não usa Vercel Cron. O agendamento recorrente do WhatsApp é feito pelo Supabase Cron para evitar o limite do plano Hobby da Vercel.

---

## Usuários de demonstração

O seed cria os seguintes usuários:

| E-mail              | Senha          | Perfil        |
| ------------------- | -------------- | ------------- |
| `admin@empresa.com` | `admin123`     | ADMINISTRADOR |
| `ana@empresa.com`   | `atendente123` | ATENDENTE     |
| `bruno@empresa.com` | `atendente123` | ATENDENTE     |
| `carla@empresa.com` | `atendente123` | ATENDENTE     |
| `diego@empresa.com` | `atendente123` | ATENDENTE     |

As senhas devem ser substituídas antes de qualquer uso real.

---

## Chamados

Cada chamado pode conter:

* protocolo;
* título;
* descrição;
* assunto;
* prioridade;
* status;
* setor;
* responsável;
* origem;
* intenção;
* confiança da intenção;
* nome do solicitante;
* contato do solicitante;
* data de abertura;
* data de atualização;
* data de resolução;
* data de fechamento.

### Prioridades

```text
BAIXA
MEDIA
ALTA
```

### Status

```text
ABERTO
EM_ANDAMENTO
RESOLVIDO
FECHADO
```

### Origens

```text
MANUAL
SIMULADOR
WHATSAPP
EMAIL
```

A origem `EMAIL` está preparada na arquitetura, mas a entrada automática por e-mail permanece inativa.

---

## Distribuição automática

Para o cálculo de carga, são considerados chamados em aberto:

* `ABERTO`;
* `EM_ANDAMENTO`.

Chamados `RESOLVIDO` e `FECHADO` não entram no cálculo, pois não representam mais uma demanda ativa para o atendente.

### Regra

1. Identifica o setor do chamado.
2. Lista os atendentes ativos do setor.
3. Conta os chamados `ABERTO` e `EM_ANDAMENTO` de cada atendente.
4. Seleciona o atendente de menor carga.
5. Desempata pelo atendente com a atribuição mais antiga.
6. Persiste a atribuição.

Exemplo:

```text
Ana: 3 chamados em aberto
Bruno: 1 chamado em aberto
Carla: 2 chamados em aberto

Novo chamado:
Responsável selecionado = Bruno
```

Caso nenhum atendente esteja disponível no setor, o chamado permanece temporariamente sem responsável para atribuição administrativa posterior.

Esse comportamento evita descartar uma solicitação válida quando a equipe do setor estiver inativa ou ainda não estiver configurada.

---

## Intent Solver

O Intent Solver é local e determinístico.

Ele não realiza chamadas a APIs de inteligência artificial generativa e não possui custo por uso.

A classificação utiliza:

* intenções cadastradas no banco;
* palavras-chave;
* exemplos;
* normalização de acentos;
* normalização de caixa;
* correspondência exata;
* busca aproximada com Fuse.js;
* confiança mínima;
* fallback para Triagem.

No cadastro manual, ele sugere:

* setor;
* prioridade;
* assunto;
* título.

O usuário ainda revisa e confirma os dados antes de salvar.

No canal do WhatsApp, o mesmo Intent Solver é reutilizado para classificar as mensagens recebidas.

---

## WhatsApp via Evolution API

Na área administrativa, o botão **Configurar WhatsApp** permite:

* ativar ou desativar a automação;
* conectar via QR Code;
* consultar o estado da instância;
* desconectar a instância;
* configurar um número para avisos;
* configurar a mensagem de primeiro contato;
* configurar a mensagem de confirmação do chamado.

### Fluxo

1. O administrador solicita a conexão.
2. O sistema cria ou conecta a instância configurada na Evolution API.
3. O webhook é configurado.
4. O QR Code é exibido.
5. O cliente envia uma primeira mensagem.
6. O sistema responde solicitando nome, assunto e descrição.
7. A resposta estruturada é validada.
8. O Intent Solver classifica a solicitação.
9. O chamado é criado com origem `WHATSAPP`.
10. O responsável é distribuído automaticamente.
11. O número de aviso, quando configurado, recebe uma notificação.
12. O protocolo é enviado ao cliente por uma rotina protegida.

A integração depende de uma Evolution API hospedada externamente.

O sistema principal continua funcionando com:

```env
EVOLUTION_API_HABILITADA="false"
```

### Cron de protocolo

O envio do protocolo utiliza:

```text
POST /api/cron/whatsapp
```

A rota exige:

```text
x-cron-secret
```

ou:

```text
Authorization: Bearer <CRON_SECRET>
```

Esse endpoint é chamado automaticamente pelo job `teste_codificar_whatsapp_protocolos` criado no Supabase.

---

## E-mail inbound futuro

O sistema possui uma estrutura inicial preparada para uma futura entrada de chamados por e-mail usando Postmark Inbound.

Endpoint preparado:

```text
POST /api/webhook/email/postmark
```

### Estado atual

* `EMAIL_ENTRADA_HABILITADA="false"` mantém a rota desativada e retorna `503`.
* `EMAIL_ENTRADA_HABILITADA="true"` retorna `501`, pois a criação de chamados por e-mail ainda não está ativa.
* Schema Zod, adaptador e autenticação Basic foram preparados.
* Nenhum e-mail cria chamado no estado atual.
* Nenhuma credencial do Postmark é necessária para avaliar o sistema.

Fluxo futuro:

```text
Caixa de suporte
  -> encaminhamento
  -> Postmark Inbound
  -> webhook
  -> Intent Solver
  -> chamado
  -> distribuição automática
```

---

## Testes e qualidade

Comandos disponíveis:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

O projeto possui 16 arquivos de testes cobrindo:

* autenticação;
* segurança;
* schemas Zod;
* Intent Solver;
* cálculo de confiança;
* fallback;
* distribuição automática;
* desempate;
* repositórios com Prisma mockado;
* serviços;
* controllers;
* integrações simuladas;
* Evolution API com `fetch` mockado;
* estrutura futura de e-mail;
* componentes compartilhados;
* utilitários;
* logger.

Nenhum teste obrigatório depende de:

* banco real;
* Evolution API real;
* conta Postmark;
* credenciais externas.

### Ambiente utilizado

```text
Node.js: 24.12.0
npm: 11.6.2
```

Antes da entrega final, execute novamente:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

E registre os resultados reais da última execução.

---

## Segurança para repositório público

* `.env` é ignorado pelo Git.
* `.env.example` contém somente placeholders.
* Segredos não utilizam `NEXT_PUBLIC_`.
* Cookies de sessão são HTTP-only.
* Tokens de sessão são persistidos com hash SHA-256.
* Senhas são persistidas com hash `scrypt`.
* Webhooks são protegidos por segredo ou Basic Auth.
* Rotas administrativas validam sessão e perfil.
* O Prisma é utilizado somente no servidor.
* A API key da Evolution não é enviada ao navegador.
* Segredos são configurados localmente e na Vercel.

Antes de qualquer uso real:

* troque as senhas do seed;
* rotacione os segredos;
* configure credenciais próprias;
* revise permissões;
* revise os limites das integrações.

---

## Limitações e trade-offs conhecidos

* A entrada por e-mail permanece inativa.
* Anexos de e-mail não são armazenados.
* O WhatsApp depende de uma Evolution API externa.
* O envio de protocolo depende do Supabase Cron e dos segredos cadastrados no Supabase Vault.
* Não existe chat em tempo real.
* O Supabase é uma dependência de infraestrutura para a execução local.
* O avaliador precisa utilizar suas próprias URLs de banco ou acessar a demonstração publicada.
* Os testes utilizam mocks do Prisma e não substituem uma suíte completa executada contra um banco temporário.
* Um chamado pode permanecer temporariamente sem responsável quando não houver atendente ativo no setor.
* A distribuição automática atende ao volume esperado para o MVP.

Em um cenário de alta concorrência, uma evolução seria utilizar:

* isolamento serializável;
* bloqueio;
* fila;
* mecanismo adicional de controle de concorrência.

Isso evitaria que duas requisições simultâneas selecionassem o mesmo atendente antes da atualização da carga.

---

## Bibliotecas e referências

Todas as dependências estão declaradas em `package.json`.

| Biblioteca                 | Utilização                                           |
| -------------------------- | ---------------------------------------------------- |
| Next.js                    | Framework full stack e App Router                    |
| React                      | Construção da interface                              |
| TypeScript                 | Tipagem estática e contratos entre camadas           |
| Prisma                     | ORM, migrations e cliente tipado                     |
| `@prisma/adapter-pg`       | Integração do Prisma 7 com PostgreSQL                |
| `pg`                       | Driver PostgreSQL                                    |
| PostgreSQL/Supabase        | Persistência relacional                              |
| Zod                        | Validação de formulários, rotas, ambiente e webhooks |
| Fuse.js                    | Busca aproximada no Intent Solver                    |
| Tailwind CSS               | Estilização                                          |
| shadcn/ui e Radix UI       | Componentes reutilizáveis e acessíveis               |
| Lucide React               | Ícones                                               |
| Sonner                     | Notificações                                         |
| date-fns                   | Manipulação e apresentação de datas                  |
| `class-variance-authority` | Variantes de componentes                             |
| `clsx`                     | Classes condicionais                                 |
| `tailwind-merge`           | Combinação de classes Tailwind                       |
| Vitest                     | Testes unitários                                     |
| React Testing Library      | Testes de componentes                                |
| `tsx`                      | Execução do seed em TypeScript                       |

---

## Scripts disponíveis

| Script                    | Finalidade                                      |
| ------------------------- | ----------------------------------------------- |
| `npm run dev`             | Inicia o ambiente de desenvolvimento            |
| `npm run build`           | Gera o Prisma Client e cria o build de produção |
| `npm run start`           | Inicia o build de produção                      |
| `npm run lint`            | Executa o ESLint                                |
| `npm run typecheck`       | Valida os tipos TypeScript                      |
| `npm run test`            | Executa os testes                               |
| `npm run test:watch`      | Executa testes em modo de observação            |
| `npm run prisma:generate` | Gera o Prisma Client                            |
| `npm run db:migrate`      | Cria migrations de desenvolvimento              |
| `npm run db:deploy`       | Aplica migrations existentes                    |
| `npm run db:seed`         | Executa o seed                                  |
| `npm run db:studio`       | Abre o Prisma Studio                            |

---

## Melhorias futuras

* Ativar a entrada de chamados por e-mail.
* Associar respostas de e-mail ao mesmo chamado.
* Processar anexos de forma segura.
* Adicionar notificações em tempo real.
* Criar métricas de tempo médio de atendimento.
* Criar histórico completo de alterações.
* Melhorar o controle de concorrência da distribuição.
* Criar testes de integração com banco temporário.
* Adicionar recuperação de senha.
* Adicionar observabilidade e alertas operacionais.

---

## Autor

Desenvolvido por Eduardo Cesar para o desafio técnico Full Stack da Codificar.
