// app/api/debug/route.ts
import { NextResponse } from "next/server";

// Ajuste este import caso seu lib/db esteja em outra pasta
import { pool } from "../../../lib/db";

export async function GET() {
  try {
    // Testa conexão e hora do banco
    const now = await pool.query("SELECT now() as now");
    // Verifica existência da tabela pedidos
    const exists = await pool.query("SELECT to_regclass('public.pedidos') as reg");
    return NextResponse.json({
      ok: true,
      db_time: now.rows?.[0]?.now ?? null,
      pedidos_table: exists.rows?.[0]?.reg ?? null
    });
  } catch (err) {
    console.error("DEBUG /api/debug error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}