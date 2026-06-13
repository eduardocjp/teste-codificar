import type { PerfilUsuarioValor } from "./dominio";

export type SessaoUsuario = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuarioValor;
  setorId: string | null;
  setorNome: string | null;
};
