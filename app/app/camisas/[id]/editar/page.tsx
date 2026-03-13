'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Funnel_Sans } from 'next/font/google';
import SidebarAdmin from '../../../components/SidebarAdmin';
import styles from '../../pedidos.module.css';

const fn = Funnel_Sans({ subsets: ['latin'], weight: '400' });

type Pedido = {
  id: number;
  rastreio?: string;
  usuario?: string;
  nome?: string;
  cpf?: string;
  telefone?: string;
  tamanho?: string;
  endereco?: string;
  status?: string;
};

const initialForm: Pedido = {
  id: 0,
  rastreio: '',
  usuario: '',
  nome: '',
  cpf: '',
  telefone: '',
  tamanho: '',
  endereco: '',
  status: '',
};

export default function EditarPedidoPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const [form, setForm] = useState<Pedido>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError('ID inválido.');
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function loadPedido() {
      try {
        setError(null);

        const res = await fetch('/api/pedidos', { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Erro ao carregar pedidos (${res.status})`);
        }

        const data = await res.json();
        if (!active) return;

        const pedidos = Array.isArray(data) ? data : [];
        const pedido = pedidos.find((p: Pedido) => Number(p.id) === id);

        if (!pedido) {
          setError('Pedido não encontrado.');
          return;
        }

        setForm({
          id: pedido.id,
          rastreio: pedido.rastreio ?? '',
          usuario: pedido.usuario ?? '',
          nome: pedido.nome ?? '',
          cpf: pedido.cpf ?? '',
          telefone: pedido.telefone ?? '',
          tamanho: pedido.tamanho ?? '',
          endereco: pedido.endereco ?? '',
          status: pedido.status ?? '',
        });
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Erro ao carregar pedido:', err);
        if (active) setError(err?.message ?? 'Erro ao carregar pedido.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPedido();

    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? `Erro ao salvar (${res.status})`);
      }

      setMessage('Pedido atualizado com sucesso.');

      setTimeout(() => {
        router.push('/pedidos/buscar');
      }, 800);
    } catch (err: any) {
      console.error('Erro ao salvar pedido:', err);
      setError(err?.message ?? 'Erro ao salvar pedido.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o pedido #${id}?`
    );

    if (!confirmed) return;

    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/pedidos', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? `Erro ao excluir (${res.status})`);
      }

      setMessage('Pedido excluído com sucesso.');

      setTimeout(() => {
        router.push('/pedidos/buscar');
      }, 600);
    } catch (err: any) {
      console.error('Erro ao excluir pedido:', err);
      setError(err?.message ?? 'Erro ao excluir pedido.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className={`${fn.className} ${styles.page}`}>
      <aside className={styles.sidebar}>
        <SidebarAdmin />
      </aside>

      <section className={styles.content}>
        <header className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <p className={styles.breadcrumb}>Pedidos / Editar</p>
              <h1 className={styles.title}>Editar pedido #{id}</h1>
            </div>

            <div>
              <Link
                href="/pedidos/buscar"
                style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: '#fff',
                  textDecoration: 'none',
                  color: '#111',
                }}
              >
                Voltar
              </Link>
            </div>
          </div>
        </header>

        <div style={{ marginTop: 16 }}>
          {loading && <p>Carregando pedido...</p>}
          {error && <p style={{ color: 'crimson' }}>Erro: {error}</p>}
          {message && <p style={{ color: 'green' }}>{message}</p>}
        </div>

        {!loading && !error && (
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'grid',
              gap: 16,
              marginTop: 20,
              maxWidth: 900,
            }}
          >
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label htmlFor="rastreio">Rastreio</label>
                <input
                  id="rastreio"
                  name="rastreio"
                  value={form.rastreio ?? ''}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="usuario">Usuário</label>
                <input
                  id="usuario"
                  name="usuario"
                  value={form.usuario ?? ''}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="nome">Nome</label>
                <input
                  id="nome"
                  name="nome"
                  value={form.nome ?? ''}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label htmlFor="cpf">CPF</label>
                <input
                  id="cpf"
                  name="cpf"
                  value={form.cpf ?? ''}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="telefone">Telefone</label>
                <input
                  id="telefone"
                  name="telefone"
                  value={form.telefone ?? ''}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="tamanho">Tamanho</label>
                <input
                  id="tamanho"
                  name="tamanho"
                  value={form.tamanho ?? ''}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={form.status ?? ''}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Selecione</option>
                  <option value="pendente">Pendente</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregue">Entregue</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="endereco">Endereço</label>
                <textarea
                  id="endereco"
                  name="endereco"
                  value={form.endereco ?? ''}
                  onChange={handleChange}
                  rows={5}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 120,
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={saving || deleting}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: saving ? '#f0f0f0' : '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: '1px solid #d66',
                  background: deleting ? '#f8eaea' : '#fff',
                  color: '#b00020',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>

              <Link
                href="/pedidos/buscar"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: '#fff',
                  textDecoration: 'none',
                  color: '#111',
                }}
              >
                Cancelar
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 6,
  padding: 10,
  borderRadius: 6,
  border: '1px solid #ccc',
  fontSize: 14,
  boxSizing: 'border-box',
};