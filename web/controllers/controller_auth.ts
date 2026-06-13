import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { autenticarUsuario, encerrarSessaoAtual, obterConfiguracaoCookieSessao } from "../lib/auth";
import { lerJsonSeguro, mapearErrosZod } from "../lib/respostas";
import { logError } from "../utils/logger";

const schemaLogin = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

/**
 * Controller do login com sessão opaca em cookie HTTP-only.
 */
export async function controllerLogin(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await lerJsonSeguro(request);
    const validacao = schemaLogin.safeParse(body);

    if (!validacao.success) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Dados inválidos.",
          errosCampos: mapearErrosZod(validacao.error),
        },
        { status: 400 },
      );
    }

    const resultado = await autenticarUsuario(validacao.data.email, validacao.data.senha);

    if (!resultado.sucesso) {
      return NextResponse.json(resultado, { status: 401 });
    }

    const configCookie = obterConfiguracaoCookieSessao(resultado.dados.sessao.expiraEm);
    const response = NextResponse.json({
      sucesso: true,
      usuario: resultado.dados.usuario,
    });

    response.cookies.set(configCookie.name, resultado.dados.sessao.token, configCookie.options);

    return response;
  } catch (erro) {
    logError("controllerLogin", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível autenticar." }, { status: 500 });
  }
}

/**
 * Controller de logout com remoção da sessão persistida.
 */
export async function controllerLogout(request: NextRequest): Promise<NextResponse> {
  try {
    await encerrarSessaoAtual();
    const response = NextResponse.redirect(new URL("/login", request.url));
    const configCookie = obterConfiguracaoCookieSessao(new Date(0));
    response.cookies.set(configCookie.name, "", configCookie.options);

    return response;
  } catch (erro) {
    logError("controllerLogout", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível encerrar a sessão." }, { status: 500 });
  }
}
