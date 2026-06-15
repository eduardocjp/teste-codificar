import { prisma } from "../lib/prisma";
import { gerarHashSha256 } from "../lib/seguranca";

export const LIMITE_TENTATIVAS_LOGIN = 3;
export const JANELA_TENTATIVAS_LOGIN_MS = 60_000;

export type ResultadoRateLimitLogin = {
  permitido: boolean;
  tentarNovamenteEm: Date | null;
};

type ChavesRateLimitLogin = {
  identificadorHash: string;
  emailHash: string;
};

function normalizarEmail(email: string): string {
  return email.toLowerCase().trim();
}

function usarHeadersProxy(): boolean {
  return process.env.VERCEL === "1" || process.env.TRUST_PROXY_HEADERS === "true";
}

function obterIpRequisicao(request: Request): string {
  if (!usarHeadersProxy()) {
    return "local";
  }

  const encaminhado = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipReal = request.headers.get("x-real-ip")?.trim();

  return encaminhado || ipReal || "proxy-sem-ip";
}

function criarChavesRateLimitLogin(request: Request, email: string): ChavesRateLimitLogin {
  const emailNormalizado = normalizarEmail(email);
  const ip = obterIpRequisicao(request);

  return {
    identificadorHash: gerarHashSha256(`login:${ip}:${emailNormalizado}`),
    emailHash: gerarHashSha256(`email:${emailNormalizado}`),
  };
}

function calcularFimJanela(janelaInicio: Date): Date {
  return new Date(janelaInicio.getTime() + JANELA_TENTATIVAS_LOGIN_MS);
}

function janelaExpirada(janelaInicio: Date, agora: Date): boolean {
  return calcularFimJanela(janelaInicio) <= agora;
}

export async function verificarRateLimitLogin(
  request: Request,
  email: string,
  agora = new Date(),
): Promise<ResultadoRateLimitLogin> {
  const chaves = criarChavesRateLimitLogin(request, email);
  const tentativa = await prisma.tentativaLogin.findUnique({
    where: { identificadorHash: chaves.identificadorHash },
  });

  if (!tentativa) {
    return { permitido: true, tentarNovamenteEm: null };
  }

  if (tentativa.bloqueadoAte && tentativa.bloqueadoAte > agora) {
    return { permitido: false, tentarNovamenteEm: tentativa.bloqueadoAte };
  }

  if (janelaExpirada(tentativa.janelaInicio, agora)) {
    await prisma.tentativaLogin.delete({ where: { id: tentativa.id } });
    return { permitido: true, tentarNovamenteEm: null };
  }

  if (tentativa.tentativas >= LIMITE_TENTATIVAS_LOGIN) {
    const tentarNovamenteEm = calcularFimJanela(tentativa.janelaInicio);

    await prisma.tentativaLogin.update({
      where: { id: tentativa.id },
      data: { bloqueadoAte: tentarNovamenteEm },
    });

    return { permitido: false, tentarNovamenteEm };
  }

  return { permitido: true, tentarNovamenteEm: null };
}

export async function registrarFalhaLogin(
  request: Request,
  email: string,
  agora = new Date(),
): Promise<ResultadoRateLimitLogin> {
  const chaves = criarChavesRateLimitLogin(request, email);
  const tentativa = await prisma.tentativaLogin.findUnique({
    where: { identificadorHash: chaves.identificadorHash },
  });

  if (!tentativa || janelaExpirada(tentativa.janelaInicio, agora)) {
    await prisma.tentativaLogin.upsert({
      where: { identificadorHash: chaves.identificadorHash },
      update: {
        emailHash: chaves.emailHash,
        tentativas: 1,
        janelaInicio: agora,
        bloqueadoAte: null,
      },
      create: {
        identificadorHash: chaves.identificadorHash,
        emailHash: chaves.emailHash,
        tentativas: 1,
        janelaInicio: agora,
      },
    });

    return { permitido: true, tentarNovamenteEm: null };
  }

  const tentativas = tentativa.tentativas + 1;
  const tentarNovamenteEm = tentativas >= LIMITE_TENTATIVAS_LOGIN
    ? calcularFimJanela(tentativa.janelaInicio)
    : null;

  await prisma.tentativaLogin.update({
    where: { id: tentativa.id },
    data: {
      tentativas,
      bloqueadoAte: tentarNovamenteEm,
    },
  });

  return {
    permitido: true,
    tentarNovamenteEm,
  };
}

export async function limparRateLimitLogin(request: Request, email: string): Promise<void> {
  const chaves = criarChavesRateLimitLogin(request, email);

  await prisma.tentativaLogin.deleteMany({
    where: { identificadorHash: chaves.identificadorHash },
  });
}
