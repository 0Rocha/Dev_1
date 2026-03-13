import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuário e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "SELECT id, usuario, senha_hash, nome FROM usuarios WHERE usuario = $1 LIMIT 1",
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos." },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    const senhaCorreta = await bcrypt.compare(password, user.senha_hash);

    if (!senhaCorreta) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        usuario: user.usuario,
        nome: user.nome,
      },
    });
  } catch (error) {
    console.error("POST /api/login:", error);

    return NextResponse.json(
      { error: "Erro interno ao fazer login." },
      { status: 500 }
    );
  }
}