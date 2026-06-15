import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { gerarHashSenha } from "../web/lib/seguranca";

const databaseUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://usuario:senha@localhost:5432/mvsoft_eventos";

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

const setoresSeed = [
  {
    nome: "Tecnologia da Informação",
    descricao: "Suporte técnico, sistemas, equipamentos e rede",
    ehTriagem: false,
  },
  {
    nome: "Infraestrutura",
    descricao: "Mobiliário, manutenção predial e estrutura física",
    ehTriagem: false,
  },
  {
    nome: "Administrativo",
    descricao: "Demandas administrativas internas",
    ehTriagem: false,
  },
  {
    nome: "Recursos Humanos",
    descricao: "Solicitações relacionadas a pessoas e documentos internos",
    ehTriagem: false,
  },
  {
    nome: "Triagem",
    descricao: "Chamados não classificados automaticamente",
    ehTriagem: true,
  },
];

const intencoesSeed = [
  {
    nome: "Problema com computador",
    slug: "problema-computador",
    assuntoSugerido: "Computador com defeito ou lentidão",
    palavrasChave: ["computador", "pc", "notebook", "travou", "lento", "tela"],
    exemplos: [
      "meu computador travou",
      "o notebook está muito lento",
      "a tela do pc está piscando",
      "computador não liga",
    ],
    setorNome: "Tecnologia da Informação",
    prioridadeSugerida: "ALTA" as const,
    confiancaMinima: 0.4,
  },
  {
    nome: "Problema com impressora",
    slug: "problema-impressora",
    assuntoSugerido: "Impressora com defeito",
    palavrasChave: ["impressora", "imprimir", "papel", "toner", "scanner"],
    exemplos: [
      "a impressora não está funcionando",
      "impressora sem toner",
      "não consigo imprimir",
      "impressora enroscando papel",
    ],
    setorNome: "Tecnologia da Informação",
    prioridadeSugerida: "MEDIA" as const,
    confiancaMinima: 0.4,
  },
  {
    nome: "Problema com internet",
    slug: "problema-internet",
    assuntoSugerido: "Sem conexão com a internet",
    palavrasChave: ["internet", "wifi", "rede", "conexão", "sem sinal", "cabo"],
    exemplos: ["sem internet", "wifi não conecta", "a rede caiu", "sem conexão"],
    setorNome: "Tecnologia da Informação",
    prioridadeSugerida: "ALTA" as const,
    confiancaMinima: 0.4,
  },
  {
    nome: "Solicitação de mobiliário",
    slug: "solicitacao-mobiliario",
    assuntoSugerido: "Necessidade de móvel ou equipamento de escritório",
    palavrasChave: ["cadeira", "mesa", "móvel", "mobiliário", "armário", "estante"],
    exemplos: ["preciso de uma cadeira nova", "minha mesa está quebrada", "troca de mobiliário"],
    setorNome: "Infraestrutura",
    prioridadeSugerida: "BAIXA" as const,
    confiancaMinima: 0.4,
  },
  {
    nome: "Solicitação administrativa",
    slug: "solicitacao-administrativa",
    assuntoSugerido: "Solicitação administrativa interna",
    palavrasChave: ["documento", "contrato", "nota", "cadastro", "administrativo"],
    exemplos: ["preciso atualizar um cadastro", "solicitar segunda via de documento"],
    setorNome: "Administrativo",
    prioridadeSugerida: "MEDIA" as const,
    confiancaMinima: 0.45,
  },
];

const canaisPadraoIntencao = ["MANUAL", "SIMULADOR", "WHATSAPP", "EMAIL"] as const;

function obterSenhaSeed(nomeVariavel: string): string {
  const senha = process.env[nomeVariavel]?.trim();

  if (!senha) {
    throw new Error(`Configure ${nomeVariavel} no ambiente local antes de executar o seed.`);
  }

  return senha;
}

async function main(): Promise<void> {
  const setores = new Map<string, string>();

  for (const setor of setoresSeed) {
    const salvo = await prisma.setor.upsert({
      where: { nome: setor.nome },
      update: {
        descricao: setor.descricao,
        ehTriagem: setor.ehTriagem,
        ativo: true,
      },
      create: {
        nome: setor.nome,
        descricao: setor.descricao,
        ehTriagem: setor.ehTriagem,
      },
    });

    setores.set(salvo.nome, salvo.id);
  }

  const senhaAdmin = await gerarHashSenha(obterSenhaSeed("SEED_SENHA_ADMIN"));
  const senhaAna = await gerarHashSenha(obterSenhaSeed("SEED_SENHA_ANA"));
  const senhaAtendente = await gerarHashSenha(obterSenhaSeed("SEED_SENHA_ATENDENTE"));

  await prisma.usuario.upsert({
    where: { email: "admin@empresa.com" },
    update: {
      nome: "Administrador",
      senhaHash: senhaAdmin,
      perfil: "ADMINISTRADOR",
      ativo: true,
      setorId: null,
    },
    create: {
      nome: "Administrador",
      email: "admin@empresa.com",
      senhaHash: senhaAdmin,
      perfil: "ADMINISTRADOR",
      ativo: true,
    },
  });

  const atendentes = [
    ["Ana Lima", "ana@empresa.com", "Tecnologia da Informação"],
    ["Bruno Costa", "bruno@empresa.com", "Tecnologia da Informação"],
    ["Carla Mendes", "carla@empresa.com", "Infraestrutura"],
    ["Diego Alves", "diego@empresa.com", "Triagem"],
  ] as const;

  for (const [nome, email, setorNome] of atendentes) {
    await prisma.usuario.upsert({
      where: { email },
      update: {
        nome,
        senhaHash: email === "ana@empresa.com" ? senhaAna : senhaAtendente,
        perfil: "ATENDENTE",
        ativo: true,
        setorId: setores.get(setorNome),
      },
      create: {
        nome,
        email,
        senhaHash: email === "ana@empresa.com" ? senhaAna : senhaAtendente,
        perfil: "ATENDENTE",
        ativo: true,
        setorId: setores.get(setorNome),
      },
    });
  }

  for (const intencao of intencoesSeed) {
    const setorId = setores.get(intencao.setorNome);

    if (!setorId) {
      continue;
    }

    await prisma.intencao.upsert({
      where: { slug: intencao.slug },
      update: {
        nome: intencao.nome,
        assuntoSugerido: intencao.assuntoSugerido,
        palavrasChave: intencao.palavrasChave,
        exemplos: intencao.exemplos,
        canais: [...canaisPadraoIntencao],
        setorId,
        prioridadeSugerida: intencao.prioridadeSugerida,
        confiancaMinima: intencao.confiancaMinima,
        ativo: true,
      },
      create: {
        nome: intencao.nome,
        slug: intencao.slug,
        assuntoSugerido: intencao.assuntoSugerido,
        palavrasChave: intencao.palavrasChave,
        exemplos: intencao.exemplos,
        canais: [...canaisPadraoIntencao],
        setorId,
        prioridadeSugerida: intencao.prioridadeSugerida,
        confiancaMinima: intencao.confiancaMinima,
      },
    });
  }

  const chamadosExistentes = await prisma.chamado.count();

  if (chamadosExistentes === 0) {
    const ana = await prisma.usuario.findUnique({ where: { email: "ana@empresa.com" } });
    const carla = await prisma.usuario.findUnique({ where: { email: "carla@empresa.com" } });
    const ti = setores.get("Tecnologia da Informação");
    const infra = setores.get("Infraestrutura");
    const triagem = setores.get("Triagem");

    if (ti && infra && triagem) {
      await prisma.chamado.createMany({
        data: [
          {
            titulo: "Notebook não liga",
            descricao: "O notebook do financeiro não liga desde esta manhã.",
            prioridade: "ALTA",
            status: "ABERTO",
            setorId: ti,
            responsavelId: ana?.id,
            origem: "MANUAL",
          },
          {
            titulo: "Cadeira quebrada na sala 3",
            descricao: "A cadeira da sala 3 está com o encosto solto.",
            prioridade: "BAIXA",
            status: "EM_ANDAMENTO",
            setorId: infra,
            responsavelId: carla?.id,
            origem: "MANUAL",
          },
          {
            titulo: "Solicitação sem classificação",
            descricao: "Pedido recebido sem dados suficientes para classificar automaticamente.",
            prioridade: "MEDIA",
            status: "ABERTO",
            setorId: triagem,
            origem: "SIMULADOR",
          },
        ],
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (erro: unknown) => {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido no seed.";
    process.stderr.write(`${mensagem}\n`);
    await prisma.$disconnect();
    process.exit(1);
  });
