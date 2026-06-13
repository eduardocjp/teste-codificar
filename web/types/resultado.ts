export type ResultadoAcao<T> =
  | {
      sucesso: true;
      dados: T;
    }
  | {
      sucesso: false;
      mensagem: string;
      errosCampos?: Record<string, string[]>;
    };
