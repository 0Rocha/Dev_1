import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function toApiLog(log: {
  id: number;
  camisaId: number;
  acao: string;
  usuarioId: number | null;
  usuarioNome: string | null;
  alteradoEm: Date;
  antes: unknown;
  depois: unknown;
}) {
  return {
    id: log.id,
    camisa_id: log.camisaId,
    acao: log.acao,
    usuario_id: log.usuarioId,
    usuario_nome: log.usuarioNome,
    alterado_em: log.alteradoEm,
    antes: log.antes,
    depois: log.depois,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const camisaId = Number(id);

    if (!camisaId || Number.isNaN(camisaId)) {
      return new Response(JSON.stringify({ error: "ID invalido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const logs = await prisma.camisaLog.findMany({
      where: { camisaId },
      orderBy: { alteradoEm: "desc" },
    });

    return new Response(JSON.stringify(logs.map(toApiLog)), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("GET /api/camisas/[id]/log:", err);

    return new Response(
      JSON.stringify({ error: err?.message ?? "Erro ao buscar log" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
