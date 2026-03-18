'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Funnel_Sans } from 'next/font/google';
import SidebarAdmin from '../../components/SidebarAdmin';
import sharedStyles from '../pedidos.module.css';
import styles from './buscar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClockRotateLeft,
  faEdit,
  faFileArrowDown,
  faFileArrowUp,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
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
          throw new Error(`Erro ao carregar camisas (${res.status})`);
        }

        const data = await res.json();

        if (!active) return;
        setOrders(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;

        console.error('Erro ao carregar camisas', err);
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
            `Nenhuma camisa foi importada. Total lido: ${total}. Ignorados: ${ignorados}.`
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
            console.warn('Falha ao recarregar camisas após importação:', err);
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

  function previewText(value?: string, max = 18) {
    const text = (value || '').trim();
    if (!text) return '-';
    if (text.length <= max) return text;
    return `${text.slice(0, max)}...`;
  }

  return (
    <main className={`${fn.className} ${sharedStyles.page}`}>
      <aside className={sharedStyles.sidebar}>
        <SidebarAdmin />
      </aside>

      <section className={sharedStyles.content}>
        <header className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={sharedStyles.breadcrumb}>
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              Buscar 
            </p>
            
          </div>

          <div className={styles.heroMeta}>
            <span className={styles.heroChip}>
              Total <strong>{orders.length}</strong>
            </span>
            <span className={styles.heroChip}>
              Resultados <strong>{resultados.length}</strong>
            </span>
          </div>
        </header>

        <section className={styles.panel}>
          <div className={styles.panelTop}>
            <div>
              <h2 className={styles.panelTitle}>Filtros e operações</h2>
              <p className={styles.panelText}>
                Escolha o campo da busca e refine o resultado. Você também pode
                importar novas camisas por CSV ou exportar a base atual.
              </p>
            </div>

            <div className={styles.panelActions}>
              <button
                type="button"
                onClick={handleFileClick}
                disabled={importLoading}
                className={styles.ghostBtn}
                aria-label="Importar CSV"
              >
                <FontAwesomeIcon icon={faFileArrowUp} />
                {importLoading ? 'Importando...' : 'Importar CSV'}
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className={styles.darkBtn}
                aria-label="Exportar CSV"
              >
                <FontAwesomeIcon icon={faFileArrowDown} />
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

          <div className={styles.filtersGrid}>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Buscar por ID</label>
              <input
                type="text"
                placeholder="Digite o ID"
                value={tipoBusca === 'id' ? busca : ''}
                onChange={(e) => {
                  setTipoBusca('id');
                  setBusca(e.target.value);
                }}
                className={`${styles.field} ${tipoBusca === 'id' ? styles.fieldActive : ''}`}
                aria-label="Buscar por ID"
              />
            </div>

            <div className={styles.fieldWrap}>
              <label className={styles.label}>Buscar por login</label>
              <input
                type="text"
                placeholder="Digite o login"
                value={tipoBusca === 'login' ? busca : ''}
                onChange={(e) => {
                  setTipoBusca('login');
                  setBusca(e.target.value);
                }}
                className={`${styles.field} ${tipoBusca === 'login' ? styles.fieldActive : ''}`}
                aria-label="Buscar por login"
              />
            </div>

            <div className={styles.fieldWrap}>
              <label className={styles.label}>Buscar por usuário</label>
              <input
                type="text"
                placeholder="Digite o nome"
                value={tipoBusca === 'usuario' ? busca : ''}
                onChange={(e) => {
                  setTipoBusca('usuario');
                  setBusca(e.target.value);
                }}
                className={`${styles.field} ${tipoBusca === 'usuario' ? styles.fieldActive : ''}`}
                aria-label="Buscar por usuário"
              />
            </div>
          </div>
        </section>

        <div className={styles.statusBar}>
          {loading && <div className={styles.statusCard}>Carregando camisas...</div>}
          {!loading && !busca && (
            <div className={styles.statusCard}>
              Digite algo em um dos campos acima para começar a busca.
            </div>
          )}
          {!loading && busca && resultados.length === 0 && (
            <div className={styles.emptyCard}>
              Nenhum resultado encontrado para &quot;{busca}&quot;.
            </div>
          )}
          {importMessage && <div className={styles.statusCard}>{importMessage}</div>}
          {importError && <div className={styles.errorCard}>Erro: {importError}</div>}
        </div>

        {!loading && resultados.length > 0 && (
          <div className={styles.tableShell}>
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
                      <td>
                        <span className={styles.idCell}>{o.id}</span>
                      </td>
                      <td title={o.rastreio ?? '-'}>
                        <span className={styles.mainText}>{previewText(o.rastreio, 16)}</span>
                        <span className={styles.subText}>Código</span>
                      </td>
                      <td title={o.usuario ?? '-'}>
                        <span className={styles.mainText}>{o.usuario ?? '-'}</span>
                        <span className={styles.subText}>Login</span>
                      </td>
                      <td title={o.nome ?? '-'}>
                        <span className={styles.mainText}>{previewText(o.nome, 22)}</span>
                        <span className={styles.subText}>Usuário</span>
                      </td>
                      <td>
                        <span
                          className={`${styles.status} ${
                            (o.status || '').toLowerCase() === 'pendente'
                              ? styles.statusPendente
                              : (o.status || '').toLowerCase() === 'enviado'
                              ? styles.statusEnviado
                              : styles.statusDefault
                          }`}
                        >
                          {o.status ?? '-'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <Link
                            href={`/pedidos/${o.id}/editar`}
                            className={styles.iconBtn}
                            title="Editar"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Link>

                          <Link
                            href={`/pedidos/${o.id}/logs`}
                            className={styles.logBtn}
                            title="Histórico"
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
          </div>
        )}
      </section>
    </main>
  );
}
