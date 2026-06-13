// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { BadgeOrigem } from "../web/views/components/badge_origem";
import { BadgePrioridade } from "../web/views/components/badge_prioridade";
import { BadgeStatus } from "../web/views/components/badge_status";
import { CabecalhoPagina } from "../web/views/components/cabecalho_pagina";
import { EstadoVazio } from "../web/views/components/estado_vazio";
import { ResultadoIntencao } from "../web/views/components/resultado_intencao";

describe("componentes compartilhados", () => {
  it("BadgePrioridade exibe label em pt-BR", () => {
    render(<BadgePrioridade prioridade="MEDIA" />);

    expect(screen.getByText("Média")).toBeTruthy();
  });

  it("BadgeStatus exibe status formatado", () => {
    render(<BadgeStatus status="EM_ANDAMENTO" />);

    expect(screen.getByText("Em andamento")).toBeTruthy();
  });

  it("BadgeOrigem exibe origem", () => {
    render(<BadgeOrigem origem="WHATSAPP" />);

    expect(screen.getByText("WhatsApp")).toBeTruthy();
  });

  it("CabecalhoPagina renderiza título, descrição e ação", () => {
    render(<CabecalhoPagina titulo="Chamados" descricao="Lista de chamados" acao={<button type="button">Novo</button>} />);

    expect(screen.getByRole("heading", { name: "Chamados" })).toBeTruthy();
    expect(screen.getByText("Lista de chamados")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Novo" })).toBeTruthy();
  });

  it("EstadoVazio renderiza conteúdo e ação opcional", () => {
    render(<EstadoVazio titulo="Sem dados" descricao="Nenhum registro encontrado" acao={<button type="button">Criar</button>} />);

    expect(screen.getByText("Sem dados")).toBeTruthy();
    expect(screen.getByText("Nenhum registro encontrado")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Criar" })).toBeTruthy();
  });

  it("ResultadoIntencao não renderiza nada quando resultado é nulo", () => {
    const { container } = render(<ResultadoIntencao resultado={null} />);

    expect(container.textContent).toBe("");
  });

  it("ResultadoIntencao renderiza intenção identificada", () => {
    render(
      <ResultadoIntencao
        resultado={{
          identificada: true,
          intencaoId: "intencao",
          nomeIntencao: "Problema com computador",
          assuntoSugerido: "Computador com defeito",
          tituloSugerido: "Computador com defeito",
          setorId: "setor",
          setorNome: "Tecnologia da Informação",
          prioridadeSugerida: "ALTA",
          confianca: 0.8,
          termosEncontrados: ["computador"],
        }}
      />,
    );

    expect(screen.getByText("Problema com computador")).toBeTruthy();
    expect(screen.getByText("80% de confiança")).toBeTruthy();
    expect(screen.getByText("Tecnologia da Informação")).toBeTruthy();
    expect(screen.getByText("Termos encontrados: computador")).toBeTruthy();
  });
});
