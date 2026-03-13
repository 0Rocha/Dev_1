import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request, context: any) {
  try {
    const id = context?.params?.id;
    const result = await pool.query("SELECT * FROM pedidos WHERE id = $1", [id]);

    if (!result.rows.length) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result.rows[0]), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("GET /api/pedidos/[id]:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Erro" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}