import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      "SELECT * FROM camisas WHERE id = $1",
      [id]
    );

    if (!result.rows.length) {
      return new Response(JSON.stringify({ error: "Camisa não encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result.rows[0]), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("GET /api/camisas/[id]:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Erro" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();

  try {
    const { id } = await params;
    const body = await request.json();

    const {
      rastreio,
      usuario,
      nome,
      cpf,
      telefone,
      tamanho,
      endereco,
      status,
      usuarioLogadoId,
      usuarioLogadoNome,
    } = body;

    await client.query("BEGIN");

    const camisaAntes = await client.query(
      "SELECT * FROM camisas WHERE id = $1",
      [id]
    );

    if (!camisaAntes.rows.length) {
      await client.query("ROLLBACK");

      return new Response(
        JSON.stringify({ error: "Camisa não encontrada" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const antes = camisaAntes.rows[0];

    const camisaAtualizada = await client.query(
      `
      UPDATE camisas
      SET
        rastreio = $1,
        usuario = $2,
        nome = $3,
        cpf = $4,
        telefone = $5,
        tamanho = $6,
        endereco = $7,
        status = $8
      WHERE id = $9
      RETURNING *
      `,
      [rastreio, usuario, nome, cpf, telefone, tamanho, endereco, status, id]
    );

    const depois = camisaAtualizada.rows[0];

    await client.query(
      `
      INSERT INTO camisas_log (
        camisa_id,
        acao,
        usuario_id,
        usuario_nome,
        antes,
        depois
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
      `,
      [
        id,
        "UPDATE",
        usuarioLogadoId ?? null,
        usuarioLogadoNome ?? usuario ?? "desconhecido",
        JSON.stringify(antes),
        JSON.stringify(depois),
      ]
    );

    await client.query("COMMIT");

    return new Response(JSON.stringify(depois), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("PUT /api/camisas/[id]:", err);

    return new Response(
      JSON.stringify({ error: err?.message ?? "Erro ao atualizar camisa" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    client.release();
  }
}
