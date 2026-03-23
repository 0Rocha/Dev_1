import { pool } from "@/lib/db";

export const runtime = "nodejs";

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

/* GET /api/camisas */
export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM camisas ORDER BY id DESC");
    return Response.json(result.rows);
  } catch (error: any) {
    console.error("GET /api/camisas:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/* POST /api/camisas - cria nova camisa */
export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const data = normalizeData(raw);

    // Validacao minima
    if (!data.usuario || typeof data.usuario !== "string" || data.usuario.trim() === "") {
      return Response.json(
        { error: "Preencha o usuario para criar a camisa." },
        { status: 400 }
      );
    }

    if (!data.nome || typeof data.nome !== "string" || data.nome.trim() === "") {
      return Response.json(
        { error: "Preencha o nome para criar a camisa." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO camisas
      (rastreio, usuario, nome, cpf, telefone, tamanho, endereco, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        data.rastreio,
        data.usuario.trim(),
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
    console.error("POST /api/camisas:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/* PUT /api/camisas - atualiza camisa (parcial) */
export async function PUT(req: Request) {
  try {
    const raw = await req.json();
    const id = Number(raw?.id ?? raw?.ID ?? raw?.Id);
    if (!id || Number.isNaN(id)) {
      return Response.json({ error: 'Campo "id" obrigatorio e numerico' }, { status: 400 });
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

    // Funcao auxiliar: verifica se o cliente enviou o campo em lower ou capitalized.
    const wasProvided = (field: string) => {
      const capitalized = field[0].toUpperCase() + field.slice(1);
      return (
        Object.prototype.hasOwnProperty.call(raw, field) ||
        Object.prototype.hasOwnProperty.call(raw, capitalized)
      );
    };

    allowedFields.forEach((field) => {
      if (!wasProvided(field)) return;
      const val = (data as any)[field];
      setClauses.push(`${field} = $${values.length + 1}`);
      values.push(typeof val === "string" ? val.trim() : val);
    });

    if (setClauses.length === 0) {
      return Response.json(
        { error: "Nenhum campo foi informado para atualizar a camisa." },
        { status: 400 }
      );
    }

    const sql = `UPDATE camisas SET ${setClauses.join(", ")} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);

    const result = await pool.query(sql, values);

    if (result.rowCount === 0) {
      return Response.json({ error: "Camisa nao encontrada" }, { status: 404 });
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/camisas:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body?.id);

    if (!id || Number.isNaN(id)) {
      return Response.json({ error: 'Campo "id" obrigatorio e numerico' }, { status: 400 });
    }

    const result = await pool.query("DELETE FROM camisas WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return Response.json({ error: "Camisa nao encontrada" }, { status: 404 });
    }

    return Response.json({ ok: true, deleted: result.rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/camisas:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

