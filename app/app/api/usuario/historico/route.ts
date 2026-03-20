import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usuario = String(searchParams.get("usuario") || "").trim();

    if (!usuario) {
      return NextResponse.json(
        { ok: false, error: "Informe o usuario para consultar o historico." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        id,
        camisa_id,
        acao,
        usuario_nome,
        alterado_em
      FROM camisas_log
      WHERE usuario_nome = $1
      ORDER BY alterado_em DESC
      LIMIT 30
      `,
      [usuario]
    );

    return NextResponse.json({
      ok: true,
      history: result.rows,
    });
  } catch (error: any) {
    console.error("GET /api/usuario/historico:", error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Erro ao buscar historico do usuario." },
      { status: 500 }
    );
  }
}
