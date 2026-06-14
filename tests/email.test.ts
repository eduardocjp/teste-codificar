import { afterEach, describe, expect, it } from "vitest";

import {
  adaptarEmailPostmark,
  deveIgnorarEmailAutomatico,
  montarTextoAnaliseEmail,
} from "../web/messaging/adaptador_email_postmark";
import { schemaWebhookEmailPostmark, type PayloadWebhookEmailPostmark } from "../web/messaging/schema_webhook_email";
import {
  compararValorSensivel,
  controllerWebhookEmailPostmark,
  validarAutenticacaoWebhookEmail,
} from "../web/controllers/controller_webhook_email";
import {
  gerarCodigoVerificacaoEmail,
  gerarIdentificadorEntradaEmail,
  montarEnderecoEncaminhamentoEmail,
} from "../web/services/servico_conexao_email";
import { POST } from "../src/app/api/webhook/email/postmark/route";

const envOriginal = { ...process.env };

function payloadPostmark(overrides: Partial<PayloadWebhookEmailPostmark> = {}): PayloadWebhookEmailPostmark {
  return {
    MessageID: "msg-123",
    From: "cliente@empresa.com",
    FromName: "Cliente Teste",
    FromFull: {
      Email: "cliente@empresa.com",
      Name: "Cliente Teste",
      MailboxHash: "origem01",
    },
    To: "suporte+cliente01@inbound.postmarkapp.com",
    ToFull: [
      {
        Email: "suporte+cliente01@inbound.postmarkapp.com",
        Name: "Suporte",
        MailboxHash: "cliente01",
      },
    ],
    Subject: "Computador não liga",
    TextBody: "O computador não liga depois da queda de energia.",
    HtmlBody: "<p>HTML não deve virar conteúdo principal.</p>",
    StrippedTextReply: "Mensagem limpa do cliente.",
    MailboxHash: "cliente01",
    Date: "2026-06-14T12:00:00.000Z",
    Headers: [
      { Name: "Auto-Submitted", Value: "no" },
      { Name: "X-Custom", Value: "abc" },
    ],
    Attachments: [],
    ...overrides,
  };
}

async function lerJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

afterEach(() => {
  process.env = { ...envOriginal };
});

describe("schemaWebhookEmailPostmark", () => {
  it("aceita payload válido do Postmark", () => {
    const resultado = schemaWebhookEmailPostmark.safeParse(payloadPostmark());

    expect(resultado.success).toBe(true);
  });

  it("rejeita payload sem MessageID", () => {
    const semMessageId: Record<string, unknown> = { ...payloadPostmark() };
    delete semMessageId.MessageID;

    const resultado = schemaWebhookEmailPostmark.safeParse(semMessageId);

    expect(resultado.success).toBe(false);
  });

  it("rejeita payload sem remetente", () => {
    const semRemetente: Record<string, unknown> = { ...payloadPostmark() };
    delete semRemetente.From;

    const resultado = schemaWebhookEmailPostmark.safeParse(semRemetente);

    expect(resultado.success).toBe(false);
  });

  it("mantém campos adicionais do provedor", () => {
    const resultado = schemaWebhookEmailPostmark.parse({
      ...payloadPostmark(),
      CampoExtra: "valor",
    });

    expect(resultado.CampoExtra).toBe("valor");
  });

  it("reconhece anexos sem exigir decodificação", () => {
    const resultado = schemaWebhookEmailPostmark.parse(payloadPostmark({
      Attachments: [
        {
          Name: "erro.txt",
          ContentType: "text/plain",
          ContentLength: 42,
          Content: "base64-nao-decodificado",
        },
      ],
    }));

    expect(resultado.Attachments).toHaveLength(1);
    expect(resultado.Attachments[0]?.Content).toBe("base64-nao-decodificado");
  });
});

describe("adaptarEmailPostmark", () => {
  it("prioriza StrippedTextReply como conteúdo principal", () => {
    const email = adaptarEmailPostmark(payloadPostmark());

    expect(email.conteudo).toBe("Mensagem limpa do cliente.");
  });

  it("usa TextBody quando não existe resposta limpa", () => {
    const email = adaptarEmailPostmark(payloadPostmark({ StrippedTextReply: "" }));

    expect(email.conteudo).toBe("O computador não liga depois da queda de energia.");
  });

  it("usa Subject como último fallback de conteúdo", () => {
    const email = adaptarEmailPostmark(payloadPostmark({
      StrippedTextReply: "",
      TextBody: "",
      Subject: "Solicitação administrativa",
    }));

    expect(email.conteudo).toBe("Solicitação administrativa");
  });

  it("extrai MailboxHash e normaliza cabeçalhos", () => {
    const email = adaptarEmailPostmark(payloadPostmark({
      Headers: [{ Name: "Precedence", Value: "bulk" }],
    }));

    expect(email.identificadorRoteamento).toBe("cliente01");
    expect(email.cabecalhos).toEqual({ precedence: "bulk" });
  });

  it("informa existência de anexos", () => {
    const email = adaptarEmailPostmark(payloadPostmark({
      Attachments: [{ Name: "foto.png", ContentType: "image/png" }],
    }));

    expect(email.possuiAnexos).toBe(true);
  });

  it("não utiliza HTML como corpo principal", () => {
    const email = adaptarEmailPostmark(payloadPostmark({
      StrippedTextReply: "",
      TextBody: "",
      Subject: "",
      HtmlBody: "<p>Ignorar HTML</p>",
    }));

    expect(email.conteudo).toBe("");
  });

  it("usa data atual informada quando Date é inválido", () => {
    const agora = new Date("2026-06-14T15:00:00.000Z");
    const email = adaptarEmailPostmark(payloadPostmark({ Date: "data-invalida" }), agora);

    expect(email.recebidoEm).toBe(agora);
  });
});

describe("servico_conexao_email", () => {
  it("gera identificador e código de verificação em formatos seguros", () => {
    expect(gerarIdentificadorEntradaEmail()).toMatch(/^[a-f0-9]{16}$/);
    expect(gerarCodigoVerificacaoEmail()).toMatch(/^VERIFICAR-[A-F0-9]{6}$/);
  });

  it("monta endereço válido com plus addressing", () => {
    expect(montarEnderecoEncaminhamentoEmail("abc123@inbound.postmarkapp.com", "cliente01"))
      .toBe("abc123+cliente01@inbound.postmarkapp.com");
  });

  it("rejeita endereço base inválido", () => {
    expect(() => montarEnderecoEncaminhamentoEmail("abc123", "cliente01")).toThrow("Endereço inbound base inválido.");
  });

  it("rejeita identificador vazio", () => {
    expect(() => montarEnderecoEncaminhamentoEmail("abc123@inbound.postmarkapp.com", " "))
      .toThrow("Identificador de e-mail obrigatório.");
  });

  it("rejeita identificador com espaço", () => {
    expect(() => montarEnderecoEncaminhamentoEmail("abc123@inbound.postmarkapp.com", "cliente 01"))
      .toThrow("Identificador de e-mail possui formato inválido.");
  });
});

describe("deveIgnorarEmailAutomatico", () => {
  it("ignora respostas automáticas", () => {
    expect(deveIgnorarEmailAutomatico({ "auto-submitted": "auto-replied" })).toBe(true);
    expect(deveIgnorarEmailAutomatico({ "auto-submitted": "auto-generated" })).toBe(true);
  });

  it("ignora listas, bulk e lixo", () => {
    expect(deveIgnorarEmailAutomatico({ precedence: "bulk" })).toBe(true);
    expect(deveIgnorarEmailAutomatico({ precedence: "junk" })).toBe(true);
    expect(deveIgnorarEmailAutomatico({ precedence: "list" })).toBe(true);
  });

  it("ignora cabeçalho de supressão automática", () => {
    expect(deveIgnorarEmailAutomatico({ "X-Auto-Response-Suppress": "All" })).toBe(true);
  });

  it("não ignora mensagem comum", () => {
    expect(deveIgnorarEmailAutomatico({ "auto-submitted": "no", precedence: "normal" })).toBe(false);
  });
});

describe("montarTextoAnaliseEmail", () => {
  it("combina assunto e corpo", () => {
    expect(montarTextoAnaliseEmail("Internet caiu", "Sem acesso no setor financeiro"))
      .toBe("Internet caiu. Sem acesso no setor financeiro");
  });

  it("retorna somente assunto quando corpo está vazio", () => {
    expect(montarTextoAnaliseEmail("Solicitação administrativa", " ")).toBe("Solicitação administrativa");
  });

  it("retorna somente corpo quando assunto está vazio", () => {
    expect(montarTextoAnaliseEmail(null, "Preciso de uma cadeira nova")).toBe("Preciso de uma cadeira nova");
  });

  it("remove espaços duplicados", () => {
    expect(montarTextoAnaliseEmail("Internet   caiu?", "Sem    acesso")).toBe("Internet caiu? Sem acesso");
  });

  it("trata resultado vazio", () => {
    expect(montarTextoAnaliseEmail(null, " ")).toBe("");
  });
});

describe("controllerWebhookEmailPostmark", () => {
  it("retorna 503 com a entrada de e-mail desabilitada", async () => {
    process.env.EMAIL_ENTRADA_HABILITADA = "false";

    const response = controllerWebhookEmailPostmark();

    expect(response.status).toBe(503);
    await expect(lerJson(response)).resolves.toEqual({
      sucesso: false,
      mensagem: "A entrada de chamados por e-mail ainda não está habilitada.",
    });
  });

  it("retorna 501 quando a flag é ativada nesta etapa incompleta", async () => {
    process.env.EMAIL_ENTRADA_HABILITADA = "true";

    const response = controllerWebhookEmailPostmark();

    expect(response.status).toBe(501);
    await expect(lerJson(response)).resolves.toEqual({
      sucesso: false,
      mensagem: "A integração de entrada por e-mail está preparada, mas ainda não foi ativada.",
    });
  });

  it("não exige credenciais quando desabilitado e não expõe segredos", async () => {
    process.env.EMAIL_ENTRADA_HABILITADA = "false";
    process.env.POSTMARK_WEBHOOK_USUARIO = "usuario-secreto";
    process.env.POSTMARK_WEBHOOK_SENHA = "senha-secreta";

    const response = controllerWebhookEmailPostmark();
    const texto = await response.text();

    expect(response.status).toBe(503);
    expect(texto).not.toContain("usuario-secreto");
    expect(texto).not.toContain("senha-secreta");
  });

  it("não lê o corpo da requisição pela rota desativada", async () => {
    process.env.EMAIL_ENTRADA_HABILITADA = "false";

    const response = await POST();

    expect(response.status).toBe(503);
  });

  it("mantém autenticação Basic futura testável sem expor detalhes", () => {
    process.env.POSTMARK_WEBHOOK_USUARIO = "postmark";
    process.env.POSTMARK_WEBHOOK_SENHA = "segredo";
    const token = Buffer.from("postmark:segredo").toString("base64");

    expect(validarAutenticacaoWebhookEmail(`Basic ${token}`)).toBe(true);
    expect(validarAutenticacaoWebhookEmail("Basic invalido")).toBe(false);
    expect(compararValorSensivel("abc", "abc")).toBe(true);
    expect(compararValorSensivel("abc", "abcd")).toBe(false);
  });
});
