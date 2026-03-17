import { NextResponse } from "next/server";
import csv from "csv-parser";
import { Readable } from "stream";
import { pool } from "@/lib/db";

function normalizeKey(value: string) {
  return String(value || "")
    .replace(/^\uFEFF/, "") // remove BOM
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}

function getField(row: Record<string, any>, aliases: string[]) {
  for (const alias of aliases) {
    const key = normalizeKey(alias);
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pedidos: Record<string, any>[] = [];

    await new Promise<void>((resolve, reject) => {
      Readable.from(buffer)
        .pipe(
          csv({
            separator: ",", // troque para ";" se seu CSV usar ponto e vírgula
            mapHeaders: ({ header }) => normalizeKey(header),
            mapValues: ({ value }) => (typeof value === "string" ? value.trim() : value),
          })
        )
        .on("data", (data) => pedidos.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    let importados = 0;
    let ignorados = 0;
    const erros: any[] = [];

    for (let i = 0; i < pedidos.length; i++) {
      const pedido = pedidos[i];

      const rastreio = getField(pedido, ["rastreio", "codigo_rastreio"]);
      const usuario = getField(pedido, ["usuario", "login"]);
      const nome = getField(pedido, ["nome", "cliente"]);
      const cpf = getField(pedido, ["cpf"]);
      const telefone = getField(pedido, ["telefone", "celular", "fone"]);
      const tamanho = getField(pedido, ["tamanho"]);
      const endereco = getField(pedido, ["endereco", "endereço"]);
      const status = getField(pedido, ["status"]) || "Pendente";

      if (!nome) {
        ignorados++;
        continue;
      }

      try {
        await pool.query(
          `INSERT INTO pedidos
          (rastreio, usuario, nome, cpf, telefone, tamanho, endereco, status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [rastreio, usuario, nome, cpf, telefone, tamanho, endereco, status]
        );

        importados++;
      } catch (err: any) {
        ignorados++;
        erros.push({
          linha: i + 2,
          nome,
          erro: err?.message || String(err),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      importados,
      ignorados,
      total: pedidos.length,
      erros,
      exemploPrimeiraLinha: pedidos[0] ?? null,
    });
  } catch (error: any) {
    console.error("Erro importando CSV:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}