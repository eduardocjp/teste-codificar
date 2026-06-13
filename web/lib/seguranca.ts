import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";

function derivarSenha(senha: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha, salt, 64, (erro, chave) => {
      if (erro) {
        reject(erro);
        return;
      }

      resolve(chave);
    });
  });
}

/**
 * Gera hash de senha com salt aleatório usando scrypt.
 */
export async function gerarHashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const chave = await derivarSenha(senha, salt);

  return `${salt}:${chave.toString("hex")}`;
}

/**
 * Verifica uma senha em texto puro contra o hash armazenado.
 */
export async function verificarSenha(senha: string, senhaHash: string): Promise<boolean> {
  const [salt, hashOriginal] = senhaHash.split(":");

  if (!salt || !hashOriginal) {
    return false;
  }

  const chave = await derivarSenha(senha, salt);
  const hashBuffer = Buffer.from(hashOriginal, "hex");

  if (hashBuffer.length !== chave.length) {
    return false;
  }

  return timingSafeEqual(hashBuffer, chave);
}

/**
 * Cria token opaco para sessão do navegador.
 */
export function gerarTokenSeguro(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Aplica SHA-256 ao token antes de persistir no banco.
 */
export function gerarHashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
