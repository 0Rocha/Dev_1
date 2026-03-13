'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Funnel_Sans } from 'next/font/google';
import SidebarAdmin from '../../components/SidebarAdmin';
import styles from '../pedidos.module.css';

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

export default function BuscarPage() {
  const [busca, setBusca] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch('/api/pedidos', { signal: controller.signal });

        if (!res.ok) {
          throw new Error(`Erro ao carregar pedidos (${res.status})`);
        }

        const data = await res.json();

        if (!active) return;
        setOrders(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;

        console.error('Erro ao carregar pedidos', err);
        if (active) setOrders([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const resultados = useMemo(() => {
    const q = (busca || '').trim().toLowerCase();
    if (!q) return [];

    const onlyDigits = /^\d+$/.test(q);
    const maybeNumber = onlyDigits ? Number(q) : NaN;

    return orders.filter((o) => {
      if (!isNaN(maybeNumber) && o.id === maybeNumber) return true;

      const rast = (o.rastreio || '').toLowerCase();
      const usu = (o.usuario || '').toLowerCase();
      const nome = (o.nome || '').toLowerCase();
      const idStr = String(o.id || '').toLowerCase();

      return (
        rast.includes(q) ||
        usu.includes(q) ||
        nome.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [busca, orders]);

  const handleFileClick = () => {
    setImportMessage(null);
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Arquivo inválido. Selecione um arquivo .csv.');
      return;
    }

    setImportLoading(true);
    setImportError(null);
    setImportMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import-pedidos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        const errMsg = data?.error ?? `Erro na importação (status ${res.status})`;
        setImportError(String(errMsg));
      } else {
        setImportMessage('Importação concluída com sucesso.');

        try {
          const r2 = await fetch('/api/pedidos');
          if (r2.ok) {
            const newData = await r2.json();
            setOrders(Array.isArray(newData) ? newData : []);
          }
        } catch (err) {
          console.warn('Falha ao recarregar pedidos após importação:', err);
        }
      }
    } catch (err: any) {
      console.error('Erro ao importar CSV:', err);
      setImportError(err?.message ?? 'Erro desconhecido ao importar CSV.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/export-pedidos', '_blank');
  };

  return (
    <main className={`${fn.className} ${styles.page}`}>
      <aside className={styles.sidebar}>
        <SidebarAdmin />
      </aside>

      <section className={styles.content}>
        <header className={styles.header}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div>
              <p className={styles.breadcrumb}>Buscar</p>
              <h1 className={styles.title}>Buscar camisas</h1>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Digite ID, rastreio, usuário ou nome"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  width: 340,
                }}
                aria-label="Buscar camisas "
              />

              <button
                type="button"
                onClick={handleFileClick}
                disabled={importLoading}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: importLoading ? '#f0f0f0' : '#fff',
                  cursor: importLoading ? 'not-allowed' : 'pointer',
                }}
                aria-label="Importar CSV "
              >
                {importLoading ? 'Importando...' : 'Importar CSV'}
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: '#fff',
                  cursor: 'pointer',
                }}
                aria-label="Exportar CSV "
              >
                Exportar CSV
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleCSV}
              />
            </div>
          </div>
        </header>

        <div style={{ marginTop: 8, marginBottom: 18 }}>
          {loading && <p>Carregando...</p>}
          {!loading && !busca && (
            <p>Digite algo no campo de busca para ver resultados.</p>
          )}
          {!loading && busca && resultados.length === 0 && (
            <p>Nenhum resultado encontrado para "{busca}".</p>
          )}

          {importMessage && <p style={{ color: 'green' }}>{importMessage}</p>}
          {importError && <p style={{ color: 'crimson' }}>Erro: {importError}</p>}
        </div>

        {!loading && resultados.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Rastreio</th>
                  <th>Usuário</th>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td className={styles.clientCell}>{o.rastreio ?? '-'}</td>
                    <td className={styles.userCell}>{o.usuario ?? '-'}</td>
                    <td className={styles.clientCell}>{o.nome ?? '-'}</td>
                    <td
                      className={`${styles.status} ${
                        (o.status || '').toLowerCase() === 'pendente'
                          ? styles.statusPendente
                          : (o.status || '').toLowerCase() === 'enviado'
                          ? styles.statusEnviado
                          : styles.statusDefault
                      }`}
                    >
                      {o.status ?? '-'}
                    </td>
                    <td>
                      <Link
                        href={`/pedidos/${o.id}/editar`}
                        style={{
                          display: 'inline-block',
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid #ccc',
                          background: '#fff',
                          textDecoration: 'none',
                          color: '#111',
                          fontSize: 14,
                        }}
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}