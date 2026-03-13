// app/lib/pedidos.ts
export type Order = {
  id: number;
  rastreio?: string;
  usuario?: string;
  nome?: string;
  cpf?: string;
  telefone?: string;
  tamanho?: string;
  endereco?: string;
  status?: string;
  created_at?: string;
};

export const PEDIDOS_STORAGE = "pedidos_v1"; // se quiser manter, opcional

// fallback vazio (não usado no server, apenas para dev)
export const ORDERS: Order[] = [];