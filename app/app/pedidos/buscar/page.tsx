'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Funnel_Sans } from 'next/font/google';
import SidebarAdmin from '../../components/SidebarAdmin';
import styles from '../pedidos.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faEdit, } from '@fortawesome/free-solid-svg-icons';
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
  const [tipoBusca, setTipoBusca] = useState<'id' | 'login' | 'usuario'>('id');

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

  return orders.filter((o) => {
    if (tipoBusca === 'id') {
      return String(o.id ?? '').toLowerCase().includes(q);
    }

    if (tipoBusca === 'login') {
      return String(o.usuario ?? '').toLowerCase().includes(q);
    }

    if (tipoBusca === 'usuario') {
      return String(o.nome ?? '').toLowerCase().includes(q);
    }

    return false;
  });
}, [busca, orders, tipoBusca]);

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
        const importados = Number(data?.importados ?? 0);
        const ignorados = Number(data?.ignorados ?? 0);
        const total = Number(data?.total ?? 0);

        if (importados === 0) {
          setImportError(
            `Nenhum pedido foi importado. Total lido: ${total}. Ignorados: ${ignorados}.`
          );
        } else {
          setImportMessage(
            `Importação concluída. Importados: ${importados}. Ignorados: ${ignorados}. Total lido: ${total}.`
          );

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
                placeholder="Buscar por ID"
                value={tipoBusca === 'id' ? busca : ''}
                onChange={(e) => {
                  setTipoBusca('id');
                  setBusca(e.target.value);
                }}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: tipoBusca === 'id' ? '1px solid #4F46E5' : '1px solid #ccc',
                  width: 180,
                }}
                aria-label="Buscar por ID"
                />

                <input
                type="text"
                placeholder="Buscar por login"
                value={tipoBusca === 'login' ? busca : ''}
                onChange={(e) => {
                  setTipoBusca('login');
                  setBusca(e.target.value);
                }}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: tipoBusca === 'login' ? '1px solid #4F46E5' : '1px solid #ccc',
                  width: 180,
                }}
                aria-label="Buscar por login"
                />

                <input
                type="text"
                placeholder="Buscar por usuário"
                value={tipoBusca === 'usuario' ? busca : ''}
                onChange={(e) => {
                  setTipoBusca('usuario');
                  setBusca(e.target.value);
                }}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: tipoBusca === 'usuario' ? '1px solid #4F46E5' : '1px solid #ccc',
                  width: 180,
                }}
                aria-label="Buscar por usuário"
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
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                           <FontAwesomeIcon icon={faEdit} />
                        </Link>

                        <Link
                          href={`/pedidos/${o.id}/logs`}
                          style={{
                            display: 'inline-block',
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: '1px solid #cfe0ff',
                            background: '#eef4ff',
                            textDecoration: 'none',
                            color: '#2954c8',
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          <FontAwesomeIcon icon={faClockRotateLeft} />
                        </Link>
                      </div>
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