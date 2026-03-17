import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `
      SELECT
        id,
        pedido_id,
        acao,
        usuario_id,
        usuario_nome,
        alterado_em,
        antes,
        depois
      FROM pedidos_log
      WHERE pedido_id = $1
      ORDER BY alterado_em DESC
      `,
      [id]
    );

    return new Response(JSON.stringify(result.rows), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("GET /api/pedidos/[id]/log:", err);

    return new Response(
      JSON.stringify({ error: err?.message ?? "Erro ao buscar log" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}