'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Funnel_Sans } from 'next/font/google';
import SidebarAdmin from '../components/SidebarAdmin';
import styles from './pedidos.module.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList,
  faEdit,
  faSave,
  faTimes,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';

const fn = Funnel_Sans({ subsets: ['latin'], weight: '400' });

export type Order = {
  id: number;
  rastreio?: string;
  usuario?: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  tamanho?: string;
  endereco?: string;
  status?: string;
  createdAt?: string;
};

type SortKey =
  | 'id'
  | 'rastreio'
  | 'usuario'
  | 'nome'
  | 'cpf'
  | 'telefone'
  | 'tamanho'
  | 'endereco'
  | 'status';

type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

const statusOrder: Record<string, number> = {
  pendente: 1,
  enviado: 2,
  entregue: 3,
  cancelado: 4,
};

export default function Pedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Partial<Order>>({});

  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch('/api/pedidos', { signal: controller.signal });

        if (!res.ok) {
          throw new Error(`Failed to load (${res.status})`);
        }

        const data = await res.json();

        if (active) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError' && active) {
          setOrders([]);
        }
      } finally {
        if (active) {
          setMounted(true);
        }
      }
    }

    load();

    const onPageshow = () => load();
    const onPop = () => load();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') load();
    };

    window.addEventListener('pageshow', onPageshow);
    window.addEventListener('popstate', onPop);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      controller.abort();
      window.removeEventListener('pageshow', onPageshow);
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  async function createOrder(payload: Partial<Order>) {
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Erro ao criar pedido');
    }

    return res.json();
  }

  async function updateOrder(id: number, payload: Partial<Order>) {
    const body = { id, ...payload };

    const res = await fetch('/api/pedidos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      const msg = errBody?.error || `Erro ao atualizar pedido (${res.status})`;
      throw new Error(msg);
    }

    return res.json();
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }

    setCurrentPage(1);
  }

  function renderSortArrow(key: SortKey) {
    if (sortKey !== key) {
      return <span className={styles.sortIcon}>↕</span>;
    }

    return (
      <span className={styles.sortIcon}>
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  }

  function getComparableValue(order: Order, key: SortKey): string | number {
    switch (key) {
      case 'id':
        return Number(order.id || 0);
      case 'status':
        return statusOrder[(order.status || '').toLowerCase()] ?? 999;
      case 'rastreio':
        return (order.rastreio || '').toLowerCase();
      case 'usuario':
        return (order.usuario || '').toLowerCase();
      case 'nome':
        return (order.nome || '').toLowerCase();
      case 'cpf':
        return (order.cpf || '').toLowerCase();
      case 'telefone':
        return (order.telefone || '').toLowerCase();
      case 'tamanho':
        return (order.tamanho || '').toLowerCase();
      case 'endereco':
        return (order.endereco || '').toLowerCase();
      default:
        return '';
    }
  }

  const sorted = useMemo(() => {
    const list = [...orders];

    list.sort((a, b) => {
      const compareA = getComparableValue(a, sortKey);
      const compareB = getComparableValue(b, sortKey);

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [orders, sortKey, sortDirection]);

  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sorted.slice(start, end);
  }, [sorted, currentPage]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  function renderPagination() {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];

    if (totalPages <= 8) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');

      pages.push(totalPages);
    }

    return (
      <div className={styles.pagination}>
        {pages.map((page, index) =>
          page === '...' ? (
            <span key={`dots-${index}`} className={styles.pageDots}>
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(Number(page))}
              className={`${styles.pageBtn} ${
                currentPage === page ? styles.pageBtnActive : ''
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>
    );
  }

  const metrics = useMemo(() => {
    const total = orders.length;
    const pendente = orders.filter(
      (o) => (o.status || '').toLowerCase() === 'pendente'
    ).length;
    const enviado = orders.filter(
      (o) => (o.status || '').toLowerCase() === 'enviado'
    ).length;

    return { total, pendente, enviado };
  }, [orders]);

  const edit = (id: number) => {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setForm({ ...o });
    setEditingId(id);
    setIsCreating(false);
  };

  const add = () => {
    setForm({
      rastreio: '',
      usuario: '',
      nome: '',
      cpf: '',
      telefone: '',
      tamanho: '',
      endereco: '',
      status: 'Pendente',
    });
    setIsCreating(true);
    setEditingId(null);
  };

  const cancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setForm({});
  };

  const save = async () => {
    if (!form.usuario || String(form.usuario).trim() === '') {
      alert('O campo Usuário é obrigatório.');
      return;
    }

    const payload: Partial<Order> = {
      rastreio: form.rastreio?.trim() || undefined,
      usuario: form.usuario?.trim() || undefined,
      nome: form.nome?.trim() || undefined,
      cpf: form.cpf || undefined,
      telefone: form.telefone || undefined,
      tamanho: form.tamanho || undefined,
      endereco: form.endereco || undefined,
      status: form.status || undefined,
    };

    try {
      if (isCreating) {
        const created: Order = await createOrder(payload);
        setOrders((prev) => [created, ...prev]);
        setIsCreating(false);
        setForm({});
      } else {
        if (editingId == null) return;
        const updated: Order = await updateOrder(editingId, payload);
        setOrders((prev) => prev.map((o) => (o.id === editingId ? updated : o)));
        setEditingId(null);
        setForm({});
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao salvar pedido');
    }
  };

  const on = <K extends keyof Order>(k: K, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const showModal = editingId !== null || isCreating;

  if (!mounted) return null;

  return (
    <main className={`${fn.className} ${styles.page}`}>
      <aside className={styles.sidebar}>
        <SidebarAdmin />
      </aside>

      <section className={styles.content}>
        <header className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <p className={styles.breadcrumb}>
                Pedidos <FontAwesomeIcon icon={faList} />
              </p>
              <h1 className={styles.title}>Listar</h1>
            </div>

            <button type="button" className={styles.editBtn} onClick={add}>
              <FontAwesomeIcon icon={faPlus} /> Adicionar
            </button>
          </div>
        </header>

        <div className={styles.metricsRow}>
          <div className={styles.metricCard}>
            <div className={styles.metricAmount}>{metrics.enviado}</div>
            <div className={styles.metricLabel}>Enviados</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricAmount}>{metrics.pendente}</div>
            <div className={styles.metricLabel}>Pendentes</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricAmount}>{metrics.total}</div>
            <div className={styles.metricLabel}>Total</div>
          </div>
        </div>

        <div className={styles.listTopBar}>
          <p className={styles.listInfo}>
            Mostrando de {startItem} até {endItem} de {totalItems} registros
          </p>
          {renderPagination()}
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} className={styles.sortableHeader}>
                  ID {renderSortArrow('id')}
                </th>
                <th onClick={() => handleSort('rastreio')} className={styles.sortableHeader}>
                  Rastreio {renderSortArrow('rastreio')}
                </th>
                <th onClick={() => handleSort('usuario')} className={styles.sortableHeader}>
                  Usuário {renderSortArrow('usuario')}
                </th>
                <th onClick={() => handleSort('nome')} className={styles.sortableHeader}>
                  Nome {renderSortArrow('nome')}
                </th>
                <th onClick={() => handleSort('cpf')} className={styles.sortableHeader}>
                  CPF {renderSortArrow('cpf')}
                </th>
                <th onClick={() => handleSort('telefone')} className={styles.sortableHeader}>
                  Telefone {renderSortArrow('telefone')}
                </th>
                <th onClick={() => handleSort('tamanho')} className={styles.sortableHeader}>
                  Tamanho {renderSortArrow('tamanho')}
                </th>
                <th onClick={() => handleSort('endereco')} className={styles.sortableHeader}>
                  Endereço {renderSortArrow('endereco')}
                </th>
                <th onClick={() => handleSort('status')} className={styles.sortableHeader}>
                  Status {renderSortArrow('status')}
                </th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {paginatedOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.rastreio ?? '-'}</td>
                  <td className={styles.userCell}>{o.usuario ?? '-'}</td>
                  <td>{o.nome ?? '-'}</td>
                  <td>{o.cpf ?? '-'}</td>
                  <td>{o.telefone ?? '-'}</td>
                  <td>{o.tamanho ?? '-'}</td>
                  <td className={styles.addressCell}>{o.endereco ?? '-'}</td>

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

                  <td className={styles.actionsCell}>
                    <Link href={`/pedidos/${o.id}`} className={styles.viewBtn}>
                      Visualizar
                    </Link>

                    <button className={styles.editBtn} onClick={() => edit(o.id)}>
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 20 }}>
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
          >
            <div className={styles.modal}>
              <h2 id="edit-title">
                {isCreating ? 'Adicionar pedido' : `Editar pedido #${editingId}`}
              </h2>

              <div className={styles.formGrid}>
                <label className={styles.label}>Rastreio</label>
                <input
                  className={styles.field}
                  value={form.rastreio ?? ''}
                  onChange={(e) => on('rastreio', e.target.value)}
                  autoFocus
                />

                <label className={styles.label}>Usuário *</label>
                <input
                  className={styles.field}
                  value={form.usuario ?? ''}
                  onChange={(e) => on('usuario', e.target.value)}
                />

                <label className={styles.label}>Nome</label>
                <input
                  className={styles.field}
                  value={form.nome ?? ''}
                  onChange={(e) => on('nome', e.target.value)}
                />

                <label className={styles.label}>CPF</label>
                <input
                  className={styles.field}
                  value={form.cpf ?? ''}
                  onChange={(e) => on('cpf', e.target.value)}
                />

                <label className={styles.label}>Telefone</label>
                <input
                  className={styles.field}
                  value={form.telefone ?? ''}
                  onChange={(e) => on('telefone', e.target.value)}
                />

                <label className={styles.label}>Tamanho</label>
                <input
                  className={styles.field}
                  value={form.tamanho ?? ''}
                  onChange={(e) => on('tamanho', e.target.value)}
                />

                <label className={styles.label}>Endereço</label>
                <textarea
                  className={styles.field}
                  rows={3}
                  value={form.endereco ?? ''}
                  onChange={(e) => on('endereco', e.target.value)}
                />

                <label className={styles.label}>Status</label>
                <select
                  className={styles.field}
                  value={form.status ?? ''}
                  onChange={(e) => on('status', e.target.value)}
                >
                  <option value="">-- selecione --</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Enviado">Enviado</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.saveBtn} onClick={save} title="Salvar">
                  <FontAwesomeIcon icon={faSave} /> Salvar
                </button>
                <button className={styles.cancelBtn} onClick={cancel} title="Cancelar">
                  <FontAwesomeIcon icon={faTimes} /> Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}