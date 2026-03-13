import { pool } from "@/lib/db";
console.log("DATABASE_URL USADA:", process.env.DATABASE_URL);

export const runtime = "nodejs";

/**
 * Normalize incoming payload keys to DB column names.
 * Accepts variants (ex: Nome -> nome).
 */
function normalizeData(input: any) {
  if (!input || typeof input !== "object") return {};
  return {
    rastreio: input.rastreio ?? input.Rastreio ?? null,
    usuario: input.usuario ?? input.Usuario ?? null,
    nome: input.nome ?? input.Nome ?? null,
    cpf: input.cpf ?? input.CPF ?? null,
    telefone: input.telefone ?? input.Telefone ?? null,
    tamanho: input.tamanho ?? input.Tamanho ?? null,
    endereco: input.endereco ?? input.Endereco ?? null,
    status: input.status ?? input.Status ?? null,
  };
}

/* GET /api/pedidos */
export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM pedidos ORDER BY id DESC");
    return Response.json(result.rows);
  } catch (error: any) {
    console.error("GET /api/pedidos:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/* POST /api/pedidos - cria novo pedido */
export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const data = normalizeData(raw);

    // Validação mínima
    if (!data.nome || typeof data.nome !== "string" || data.nome.trim() === "") {
      return Response.json({ error: 'Campo "nome" obrigatório' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO pedidos
      (rastreio, usuario, nome, cpf, telefone, tamanho, endereco, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        data.rastreio,
        data.usuario,
        data.nome.trim(),
        data.cpf,
        data.telefone,
        data.tamanho,
        data.endereco,
        data.status,
      ]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("POST /api/pedidos:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/* PUT /api/pedidos - atualiza pedido (parcial) */
export async function PUT(req: Request) {
  try {
    const raw = await req.json();

      // (para debugar o body vindo do frontend)
    console.log("DEBUG - BODY RECEBIDO NO PUT /api/pedidos:", raw);
    // <<< fim do debug
    const id = Number(raw?.id ?? raw?.ID ?? raw?.Id);
    if (!id || Number.isNaN(id)) {
      return Response.json({ error: 'Campo "id" obrigatório e numérico' }, { status: 400 });
    }

    const data = normalizeData(raw);

    const allowedFields: (keyof typeof data)[] = [
      "rastreio",
      "usuario",
      "nome",
      "cpf",
      "telefone",
      "tamanho",
      "endereco",
      "status",
    ];

    const setClauses: string[] = [];
    const values: any[] = [];

    // função auxiliar: verifica se o cliente enviou o campo (em lower ou capitalized)
    const wasProvided = (field: string) => {
      const capitalized = field[0].toUpperCase() + field.slice(1);
      return Object.prototype.hasOwnProperty.call(raw, field) || Object.prototype.hasOwnProperty.call(raw, capitalized);
    };

    allowedFields.forEach((field) => {
      if (!wasProvided(field)) return; // só inclui se foi enviado no body
      const val = (data as any)[field];
      setClauses.push(`${field} = $${values.length + 1}`);
      values.push(typeof val === "string" ? val.trim() : val);
    });

    if (setClauses.length === 0) {
      return Response.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
    }

    // adiciona id como último parâmetro
    const sql = `UPDATE pedidos SET ${setClauses.join(", ")} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);

    // DEBUG opcional: log SQL e values (remova em produção)
    console.log("SQL:", sql);
    console.log("VALUES:", values);

    const result = await pool.query(sql, values);

    if (result.rowCount === 0) {
      return Response.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/pedidos:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body?.id);

    if (!id || Number.isNaN(id)) {
      return Response.json(
        { error: 'Campo "id" obrigatório e numérico' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'DELETE FROM pedidos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return Response.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    return Response.json(
      { ok: true, deleted: result.rows[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE /api/pedidos:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}