import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function toApiHistoryItem(item: {
  id: number;
  camisaId: number;
  acao: string;
  usuarioNome: string | null;
  alteradoEm: Date;
}) {
  return {
    id: item.id,
    camisa_id: item.camisaId,
    acao: item.acao,
    usuario_nome: item.usuarioNome,
    alterado_em: item.alteradoEm,
  };
}

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

    const history = await prisma.camisaLog.findMany({
      where: { usuarioNome: usuario },
      select: {
        id: true,
        camisaId: true,
        acao: true,
        usuarioNome: true,
        alteradoEm: true,
      },
      orderBy: { alteradoEm: "desc" },
      take: 30,
    });

    return NextResponse.json({
      ok: true,
      history: history.map(toApiHistoryItem),
    });
  } catch (error: any) {
    console.error("GET /api/usuario/historico:", error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Erro ao buscar historico do usuario." },
      { status: 500 }
    );
  }
}
