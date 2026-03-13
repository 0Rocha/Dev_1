// app/camisas/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SidebarAdmin from '../../components/SidebarAdmin';
import styles from './[id].module.css';

type Order = {
  id: number;
  rastreio?: string;
  usuario?: string;
  Nome?: string;
  cpf?: string;
  telefone?: string;
  tamanho?: string;
  endereco?: string;
  status?: string;
  created_at?: string;
};

export default function CamisaPage() {
  const params = useParams();             // cliente-safe
  const router = useRouter();
  const id = String(params?.id ?? '');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/pedidos/${encodeURIComponent(id)}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Pedido não encontrado.');
          } else {
            throw new Error('Erro ao buscar pedido ');
          }
        }
        const data = await res.json();
        if (mounted) setOrder(data);
      } catch (err: any) {
        if (mounted) {
          setOrder(null);
          setError(err?.message ?? 'Erro desconhecido');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <main className={styles.page}>
        <aside className={styles.sidebar}><SidebarAdmin /></aside>
        <section className={styles.content}><p>Carregando...</p></section>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className={styles.page}>
        <aside className={styles.sidebar}><SidebarAdmin /></aside>
        <section className={styles.content}>
          <h1>Camisa não encontrada</h1>
          <p>{error ?? `ID buscado: ${id || '(não disponível)'}`}</p>
          <p>
            <Link href="/pedidos" className={styles.btnSecondary}>Voltar para lista</Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}><SidebarAdmin /></aside>
      <section className={styles.content}>
        <header className={styles.header}>
          <nav aria-label="breadcrumb" className={styles.breadcrumb}>
            Camisa <span>#{order.id}</span>
          </nav>

          <h1 className={styles.title}>
            Camisa #{order.id} {order.rastreio ? `(Rastreio ${order.rastreio})` : ''}
          </h1>

          <p className={styles.subtitle}>
            Nome: {order.Nome ?? '-'} {order.usuario ? `(${order.usuario})` : ''}
          </p>
        </header>

        <div className={styles.card}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <span className={styles.label}>Rastreio</span>
              <span className={styles.value}>{order.rastreio ?? '-'}</span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>CPF</span>
              <span className={styles.value}>{order.cpf ?? '-'}</span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Telefone</span>
              <span className={styles.value}>{order.telefone ?? '-'}</span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Tamanho</span>
              <span className={styles.value}>{order.tamanho ?? '-'}</span>
            </div>

            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.label}>Endereço</span>
              <span className={styles.value}>{order.endereco ?? '-'}</span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Status</span>
              <span className={styles.value}>{order.status ?? '-'}</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={() => router.back()} className={styles.btnSecondary}>Voltar</button>
        </div>
      </section>
    </main>
  );
}