import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type ShirtRow = {
  id: number;
  rastreio: string | null;
  usuario: string | null;
  nome: string | null;
  cpf: string | null;
  telefone: string | null;
  tamanho: string | null;
  endereco: string | null;
  status: string | null;
  created_at: string | null;
};

type SummaryRow = {
  status: string | null;
  total: string;
};

function normalizeQuestion(input: unknown) {
  if (typeof input !== "string") return "";
  return input.trim().replace(/\s+/g, " ");
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(question: string) {
  return Array.from(
    new Set(
      normalizeText(question)
        .match(/[a-z0-9@._-]{3,}/g) ?? []
    )
  ).slice(0, 8);
}

function rowToSearchText(row: ShirtRow) {
  return normalizeText([
    row.id,
    row.rastreio,
    row.usuario,
    row.nome,
    row.cpf,
    row.telefone,
    row.tamanho,
    row.endereco,
    row.status,
    row.created_at,
  ].join(" "));
}

function detectStatusTerms(question: string) {
  const normalizedQuestion = normalizeText(question);
  const statusAliases: Record<string, string[]> = {
    pendente: ["pendente", "pendentes"],
    enviado: ["enviado", "enviados", "enviada", "enviadas"],
    entregue: ["entregue", "entregues"],
    cancelado: ["cancelado", "cancelados", "cancelada", "canceladas"],
  };

  return Object.entries(statusAliases)
    .filter(([, aliases]) => aliases.some((alias) => normalizedQuestion.includes(alias)))
    .map(([status]) => status);
}

function detectExplicitId(question: string) {
  const normalizedQuestion = normalizeText(question);
  const match =
    normalizedQuestion.match(/\bid\s*(?:numero|n|num)?\s*(\d+)\b/) ||
    normalizedQuestion.match(/\bcamisa\s*(\d+)\b/) ||
    normalizedQuestion.match(/\bpedido\s*(\d+)\b/);

  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function compactRow(row: ShirtRow) {
  return {
    id: row.id,
    rastreio: row.rastreio ?? "",
    usuario: row.usuario ?? "",
    nome: row.nome ?? "",
    cpf: row.cpf ?? "",
    telefone: row.telefone ?? "",
    tamanho: row.tamanho ?? "",
    endereco: row.endereco ?? "",
    status: row.status ?? "",
    created_at: row.created_at ?? "",
  };
}

function findStatusTotal(summaryRows: SummaryRow[], status: string) {
  return summaryRows.reduce((sum, row) => {
    return normalizeText(row.status) === status ? sum + Number(row.total ?? 0) : sum;
  }, 0);
}

function formatStatusAnswer(status: string, rows: ShirtRow[], total: number) {
  const previewLimit = 10;
  const previewRows = rows.slice(0, previewLimit);
  const remaining = Math.max(total - previewRows.length, 0);
  const titleStatus = status.charAt(0).toUpperCase() + status.slice(1);

  if (total === 0) {
    return `Nao encontrei camisas com status ${titleStatus}.`;
  }

  const lines = [
    `Encontrei ${total} camisa${total === 1 ? "" : "s"} com status ${titleStatus}.`,
    "",
    `Mostrando ${previewRows.length} registro${previewRows.length === 1 ? "" : "s"}:`,
    ...previewRows.map((row) => {
      const parts = [
        `ID ${row.id}`,
        row.nome ? `usuario ${row.nome}` : null,
        row.usuario ? `login ${row.usuario}` : null,
        row.rastreio ? `rastreio ${row.rastreio}` : null,
      ].filter(Boolean);

      return parts.join(" | ");
    }),
  ];

  if (remaining > 0) {
    lines.push("");
    lines.push(`Existem mais ${remaining} registro${remaining === 1 ? "" : "s"} com esse status alem dos mostrados acima.`);
  }

  return lines.join("\n");
}

function buildContext(question: string, rows: ShirtRow[], summaryRows: SummaryRow[]) {
  const tokens = tokenize(question);
  const statusTerms = detectStatusTerms(question);
  const explicitId = detectExplicitId(question);

  const idRows =
    explicitId !== null
      ? rows.filter((row) => row.id === explicitId).slice(0, 1)
      : [];

  const statusRows =
    statusTerms.length > 0
      ? rows
          .filter((row) => statusTerms.includes(normalizeText(row.status)))
          .slice(0, 40)
      : [];

  const relevantRows =
    tokens.length > 0
      ? rows.filter((row) => tokens.some((token) => rowToSearchText(row).includes(token))).slice(0, 20)
      : [];

  const fallbackRows = rows.slice(0, 12);
  const contextRows =
    idRows.length > 0
      ? idRows
      : statusRows.length > 0
      ? statusRows
      : relevantRows.length > 0
        ? relevantRows
        : fallbackRows;
  const totalRows = summaryRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const contextMode =
    idRows.length > 0
      ? "registro localizado por ID da pergunta"
      : statusRows.length > 0
      ? "registros filtrados por status da pergunta"
      : relevantRows.length > 0
        ? "registros filtrados pela pergunta"
        : "ultimas camisas cadastradas";

  return {
    summary: {
      total_camisas_consideradas: totalRows,
      totais_por_status: summaryRows.map((row) => ({
        status: row.status ?? "Sem status",
        total: Number(row.total ?? 0),
      })),
    },
    contexto_utilizado: contextMode,
    camisas: contextRows.map(compactRow),
  };
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "A chave do Gemini nao esta configurada no servidor." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const question = normalizeQuestion(body?.question);

    if (!question) {
      return NextResponse.json(
        { ok: false, error: "Envie uma pergunta para a assistente." },
        { status: 400 }
      );
    }

    const [rowsResult, summaryResult] = await Promise.all([
      pool.query<ShirtRow>(
        `SELECT id, rastreio, usuario, nome, cpf, telefone, tamanho, endereco, status, created_at
         FROM pedidos
         ORDER BY id DESC
         LIMIT 200`
      ),
      pool.query<SummaryRow>(
        `SELECT status, COUNT(*)::text AS total
         FROM pedidos
         GROUP BY status
         ORDER BY COUNT(*) DESC, status ASC`
      ),
    ]);

    const statusTerms = detectStatusTerms(question);

    if (statusTerms.length === 1 && detectExplicitId(question) === null) {
      const targetStatus = statusTerms[0];
      const matchingRows = rowsResult.rows.filter(
        (row) => normalizeText(row.status) === targetStatus
      );
      const total = findStatusTotal(summaryResult.rows, targetStatus);

      return NextResponse.json({
        ok: true,
        answer: formatStatusAnswer(targetStatus, matchingRows, total),
        usedRows: Math.min(matchingRows.length, 10),
        contextMode: "resposta direta por status",
      });
    }

    const context = buildContext(question, rowsResult.rows, summaryResult.rows);

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Voce e uma assistente do painel administrativo de camisas.",
                "Responda sempre em portugues do Brasil.",
                "Responda apenas em texto simples.",
                "Nao use markdown, asteriscos, negrito, listas com bullets, tabelas ou cercas de codigo.",
                "Use apenas os dados fornecidos no CONTEXTO.",
                "Se a resposta nao estiver nos dados, diga claramente que nao encontrou a informacao.",
                "Nao invente IDs, nomes, status, quantidades ou enderecos.",
                "Quando fizer sentido, cite os IDs das camisas usadas na resposta.",
                "",
                `PERGUNTA: ${question}`,
                "",
                `CONTEXTO: ${JSON.stringify(context)}`,
              ].join("\n"),
            },
          ],
        },
      ],
    });

    const answer = String(response.text ?? "").trim();

    if (!answer) {
      return NextResponse.json(
        { ok: false, error: "A assistente nao conseguiu gerar uma resposta agora." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      answer,
      usedRows: context.camisas.length,
      contextMode: context.contexto_utilizado,
    });
  } catch (error: any) {
    console.error("POST /api/ai/ask:", error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Erro ao consultar a assistente IA." },
      { status: 500 }
    );
  }
}
