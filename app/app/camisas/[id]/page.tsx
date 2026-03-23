'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Funnel_Sans } from 'next/font/google';
import SidebarAdmin from '../../components/SidebarAdmin';
import styles from './[id].module.css';

const fn = Funnel_Sans({ subsets: ['latin'], weight: '400' });

type Order = {
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

export default function CamisaPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? '');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/camisas/${encodeURIComponent(id)}`);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Camisa não encontrada.');
          }

          throw new Error(`Erro ao buscar camisa (${res.status}).`);
        }

        const data = await res.json();
        if (mounted) setOrder(data);
      } catch (err: any) {
        if (mounted) {
          setOrder(null);
          setError(err?.message ?? 'Erro ao carregar a camisa.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/camisas', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? `Erro ao excluir camisa (${res.status}).`);
      }

      setMessage('Camisa excluída com sucesso.');

      setTimeout(() => {
        router.push('/camisas/buscar');
      }, 600);
    } catch (err: any) {
      console.error('Erro ao excluir camisa:', err);
      setError(err?.message ?? 'Não foi possível excluir a camisa.');
    } finally {
      setDeleting(false);
    }
  }

  function openDeleteConfirm() {
    setConfirmOpen(true);
  }

  function closeDeleteConfirm() {
    if (deleting) return;
    setConfirmOpen(false);
  }

  return (
    <main className={`${fn.className} ${styles.page}`}>
      <aside className={styles.sidebar}>
        <SidebarAdmin />
      </aside>

      <section className={styles.content}>
        {loading ? (
          <div className={styles.emptyState}>Carregando camisa...</div>
        ) : error || !order ? (
          <div className={styles.emptyState}>
            <h1 className={styles.emptyTitle}>Camisa não encontrada</h1>
            <p>{error ?? `ID buscado: ${id || '(não disponível)'}`}</p>
            <Link href="/camisas/buscar" className={styles.backBtn}>
              Voltar para busca
            </Link>
          </div>
        ) : (
          <>
            <header className={styles.topBar}>
              <div>
                <p className={styles.breadcrumb}>Camisas / Visualizar</p>
                <h1 className={styles.title}>Camisa #{order.id}</h1>
                <p className={styles.subtitle}>
                  Nome: {order.nome ?? '-'} {order.usuario ? `(${order.usuario})` : ''}
                </p>
              </div>

              <div className={styles.topActions}>
                <Link href={`/camisas/${order.id}/editar`} className={styles.editBtn}>
                  Editar
                </Link>
                <Link href="/camisas/buscar" className={styles.backBtn}>
                  Voltar
                </Link>
              </div>
            </header>

            {message ? <p className={styles.successMessage}>{message}</p> : null}
            {error ? <p className={styles.errorMessage}>{error}</p> : null}

            <div className={styles.card}>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <span className={styles.label}>Rastreio</span>
                  <span className={styles.value}>{order.rastreio ?? '-'}</span>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Usuário</span>
                  <span className={styles.value}>{order.usuario ?? '-'}</span>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Nome</span>
                  <span className={styles.value}>{order.nome ?? '-'}</span>
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

                <div className={`${styles.field} ${styles.fieldFull}`}>
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
              <button
                type="button"
                onClick={openDeleteConfirm}
                className={styles.deleteBtn}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>

              <button type="button" onClick={() => router.back()} className={styles.secondaryBtn}>
                Voltar
              </button>
            </div>
          </>
        )}
      </section>

      {confirmOpen ? (
        <div className={styles.modalOverlay} onClick={closeDeleteConfirm}>
          <div
            className={styles.confirmModal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
          >
            <p className={styles.confirmEyebrow}>Confirmar exclusão</p>
            <h2 id="delete-confirm-title" className={styles.confirmTitle}>
              Excluir camisa #{id}?
            </h2>
            <p className={styles.confirmText}>
              Tem certeza que deseja excluir esta camisa? Essa ação não pode ser desfeita.
            </p>

            <div className={styles.confirmActions}>
              <button
                type="button"
                onClick={closeDeleteConfirm}
                className={styles.secondaryBtn}
                disabled={deleting}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className={styles.deleteBtn}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Excluir agora'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

