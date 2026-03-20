// app/lib/camisas.ts
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

export const CAMISAS_STORAGE = "camisas_v1";

// fallback vazio (não usado no server, apenas para dev)
export const ORDERS: Order[] = [];
