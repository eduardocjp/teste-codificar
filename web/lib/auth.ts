import { cookies } from "next/headers";

import { prisma } from "./prisma";
import { gerarHashToken, gerarTokenSeguro, verificarSenha } from "./seguranca";
import { obterEnv } from "./env";
import type { PerfilUsuarioValor } from "../types/dominio";
import type { ResultadoAcao } from "../types/resultado";
import type { SessaoUsuario } from "../types/usuario";

export type SessaoCriada = {
  token: string;
  expiraEm: Date;
};

function obterNomeCookieSessao(): string {
  return obterEnv().SESSAO_NOME_COOKIE;
}

function obterDuracaoSessaoHoras(): number {
  return obterEnv().SESSAO_DURACAO_HORAS;
}

function calcularExpiracaoSessao(): Date {
  const expiraEm = new Date();
  expiraEm.setHours(expiraEm.getHours() + obterDuracaoSessaoHoras());
  return expiraEm;
}

/**
 * Cria sessão opaca persistida no banco e retorna o token bruto para cookie.
 */
export async function criarSessaoUsuario(usuarioId: string): Promise<SessaoCriada> {
  const token = gerarTokenSeguro();
  const expiraEm = calcularExpiracaoSessao();

  await prisma.sessao.create({
    data: {
      tokenHash: gerarHashToken(token),
      usuarioId,
      expiraEm,
    },
  });

  return { token, expiraEm };
}

function montarSessaoUsuario(usuario: {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuarioValor;
  setorId: string | null;
  setor: { nome: string } | null;
}): SessaoUsuario {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    setorId: usuario.setorId,
    setorNome: usuario.setor?.nome ?? null,
  };
}

/**
 * Valida credenciais e cria uma sessão de usuário.
 */
export async function autenticarUsuario(
  email: string,
  senha: string,
): Promise<ResultadoAcao<{ usuario: SessaoUsuario; sessao: SessaoCriada }>> {
  const usuario = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { setor: { select: { nome: true } } },
  });

  if (!usuario || !usuario.ativo) {
    return { sucesso: false, mensagem: "Credenciais inválidas." };
  }

  const senhaValida = await verificarSenha(senha, usuario.senhaHash);

  if (!senhaValida) {
    return { sucesso: false, mensagem: "Credenciais inválidas." };
  }

  const sessao = await criarSessaoUsuario(usuario.id);

  return {
    sucesso: true,
    dados: {
      usuario: montarSessaoUsuario(usuario),
      sessao,
    },
  };
}

/**
 * Obtém a sessão atual a partir do cookie HTTP-only.
 */
export async function obterSessaoAtual(): Promise<SessaoUsuario | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(obterNomeCookieSessao())?.value;

  if (!token) {
    return null;
  }

  const sessao = await prisma.sessao.findUnique({
    where: { tokenHash: gerarHashToken(token) },
    include: {
      usuario: {
        include: { setor: { select: { nome: true } } },
      },
    },
  });

  if (!sessao || sessao.expiraEm <= new Date() || !sessao.usuario.ativo) {
    if (sessao) {
      await prisma.sessao.delete({ where: { id: sessao.id } });
    }

    return null;
  }

  return montarSessaoUsuario(sessao.usuario);
}

/**
 * Exige sessão e, opcionalmente, um dos perfis informados.
 */
export async function validarSessaoAtiva(
  perfisPermitidos?: PerfilUsuarioValor[],
): Promise<ResultadoAcao<SessaoUsuario>> {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    return { sucesso: false, mensagem: "Sessão inválida ou expirada." };
  }

  if (perfisPermitidos && !perfisPermitidos.includes(sessao.perfil)) {
    return { sucesso: false, mensagem: "Você não possui permissão." };
  }

  return { sucesso: true, dados: sessao };
}

/**
 * Remove a sessão atual do banco, quando existir.
 */
export async function encerrarSessaoAtual(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(obterNomeCookieSessao())?.value;

  if (!token) {
    return;
  }

  await prisma.sessao.deleteMany({
    where: { tokenHash: gerarHashToken(token) },
  });
}

export function obterConfiguracaoCookieSessao(expiraEm: Date) {
  return {
    name: obterNomeCookieSessao(),
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiraEm,
    },
  };
}
