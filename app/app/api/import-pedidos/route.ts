import { NextResponse } from "next/server";
import { Pool } from "pg";
import csv from "csv-parser";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pedidos: any[] = [];

    await new Promise<void>((resolve, reject) => {
      const stream = require("stream");
      const readable = new stream.Readable();

      readable._read = () => {};
      readable.push(buffer);
      readable.push(null);

      readable
        .pipe(csv())
        .on("data", (data: any) => pedidos.push(data))
        .on("end", () => resolve())
        .on("error", (err: any) => reject(err));
    });

    let importados = 0;
    let ignorados = 0;

    for (const pedido of pedidos) {
      const rastreio = pedido.rastreio ?? pedido.ticket ?? null;
      const usuario = pedido.usuario ?? pedido.ganhadores ?? null;
      const nome = pedido.nome ?? pedido.cliente ?? null;
      const cpf = pedido.cpf ?? null;
      const telefone = pedido.telefone ?? null;
      const tamanho = pedido.tamanho ?? null;
      const endereco = pedido.endereco ?? null;
      const status = pedido.status ?? "pendente";

      if (!nome || String(nome).trim() === "") {
        ignorados++;
        continue;
      }

      await pool.query(
        `INSERT INTO pedidos 
        (rastreio, usuario, nome, cpf, telefone, tamanho, endereco, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          rastreio,
          usuario,
          nome,
          cpf,
          telefone,
          tamanho,
          endereco,
          status
        ]
      );

      importados++;
    }

    return NextResponse.json({
      ok: true,
      importados,
      ignorados,
      total: pedidos.length
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}