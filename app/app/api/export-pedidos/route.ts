import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

function escapeCsv(value: unknown) {
  if (value === null || value === undefined) return "";
  const str = String(value);

  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        rastreio,
        usuario,
        nome,
        cpf,
        telefone,
        tamanho,
        endereco,
        status,
        created_at
      FROM pedidos
      ORDER BY id DESC
    `);

    const headers = [
      "id",
      "rastreio",
      "usuario",
      "nome",
      "cpf",
      "telefone",
      "tamanho",
      "endereco",
      "status",
      "created_at",
    ];

    const lines = [
      headers.join(","),
      ...result.rows.map((row) =>
        [
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
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ];

    const csvContent = "\uFEFF" + lines.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="camisas.csv"',
      },
    });
  } catch (error: any) {
    console.error("GET /api/export-camisas:", error);

    return NextResponse.json(
      { ok: false, error: error.message ?? String(error) },
      { status: 500 }
    );
  }
}