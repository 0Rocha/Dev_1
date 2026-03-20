'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Funnel_Sans } from 'next/font/google';
import SidebarAdmin from '../../../components/SidebarAdmin';
import styles from '../../camisas.module.css';

const fn = Funnel_Sans({ subsets: ['latin'], weight: '400' });

type Camisa = {
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

const initialForm: Camisa = {
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

export default function EditarCamisaPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const [form, setForm] = useState<Camisa>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const localAuth = localStorage.getItem('auth');
  const sessionAuth = sessionStorage.getItem('auth');

  const localUser =
    localStorage.getItem('usuarioLogado') || localStorage.getItem('user');
  const sessionUser =
    sessionStorage.getItem('usuarioLogado') || sessionStorage.getItem('user');

  if (
    (localAuth !== 'true' && sessionAuth !== 'true') ||
    (!localUser && !sessionUser)
  ) {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    localStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('auth');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('usuarioLogado');

    router.push('/');
  }
}, [router]);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError('ID inválido.');
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function loadCamisa() {
      try {
        setError(null);

        const res = await fetch(`/api/camisas/${id}`, { signal: controller.signal });

              if (!res.ok) {
              const data = await res.json().catch(() => null);
              throw new Error(data?.error ?? `Erro ao carregar camisa (${res.status})`);
              }

              const camisa = await res.json();
              if (!active) return;

        setForm({
          id: camisa.id,
          rastreio: camisa.rastreio ?? '',
          usuario: camisa.usuario ?? '',
          nome: camisa.nome ?? '',
          cpf: camisa.cpf ?? '',
          telefone: camisa.telefone ?? '',
          tamanho: camisa.tamanho ?? '',
          endereco: camisa.endereco ?? '',
          status: camisa.status ?? '',
        });
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Erro ao carregar camisa:', err);
        if (active) setError(err?.message ?? 'Erro ao carregar camisa.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCamisa();

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
    const usuarioLogadoNome =
      localStorage.getItem('usuarioLogado') ||
      sessionStorage.getItem('usuarioLogado') ||
      localStorage.getItem('user') ||
      sessionStorage.getItem('user');

    if (!usuarioLogadoNome) {
      router.push('/');
      throw new Error('Sessão inválida. Faça login novamente.');
    }

    const payload = {
      rastreio: form.rastreio ?? '',
      usuario: form.usuario ?? '',
      nome: form.nome ?? '',
      cpf: form.cpf ?? '',
      telefone: form.telefone ?? '',
      tamanho: form.tamanho ?? '',
      endereco: form.endereco ?? '',
      status: form.status ?? '',
      usuarioLogadoNome,
    };

    const res = await fetch(`/api/camisas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error ?? `Erro ao salvar (${res.status})`);
    }

    setMessage('Camisa atualizada com sucesso.');

    setTimeout(() => {
      router.push('/camisas/buscar');
    }, 800);
  } catch (err: any) {
    console.error('Erro ao salvar camisa:', err);
    setError(err?.message ?? 'Erro ao salvar camisa.');
  } finally {
    setSaving(false);
  }
}

  async function handleDelete() {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a camisa #${id}?`
    );

    if (!confirmed) return;

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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? `Erro ao excluir (${res.status})`);
      }

      setMessage('Camisa excluída com sucesso.');

      setTimeout(() => {
        router.push('/camisas/buscar');
      }, 600);
    } catch (err: any) {
      console.error('Erro ao excluir camisa:', err);
      setError(err?.message ?? 'Erro ao excluir camisa.');
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
              <p className={styles.breadcrumb}>Camisas / Editar</p>
              <h1 className={styles.title}>Editar camisa #{id}</h1>
            </div>

            <div>
              <Link
                href="/camisas/buscar"
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
          {loading && <p>Carregando camisa...</p>}
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
                  
                  <option value="Pendente">Pendente</option>
                  <option value="Enviado">Enviado</option>
                  
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
                href="/camisas/buscar"
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
