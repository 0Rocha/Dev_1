'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Funnel_Sans } from 'next/font/google';
import SidebarAdmin from '../../../components/SidebarAdmin';
import sharedStyles from '../../camisas.module.css';
import styles from './editar.module.css';

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
  const [confirmOpen, setConfirmOpen] = useState(false);
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
      setError('ID invÃ¡lido.');
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
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

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
        throw new Error('SessÃ£o invÃ¡lida. FaÃ§a login novamente.');
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
        throw new Error(data?.error ?? `Erro ao excluir (${res.status})`);
      }

      setConfirmOpen(false);
      setMessage('Camisa excluÃ­da com sucesso.');

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

  function openDeleteConfirm() {
    setConfirmOpen(true);
  }

  function closeDeleteConfirm() {
    if (deleting) return;
    setConfirmOpen(false);
  }

  return (
    <main className={`${fn.className} ${sharedStyles.page}`}>
      <aside className={sharedStyles.sidebar}>
        <SidebarAdmin />
      </aside>

      <section className={sharedStyles.content}>
        <header className={styles.hero}>
          <div>
            <p className={sharedStyles.breadcrumb}>Camisas / Editar</p>
            <h1 className={sharedStyles.title}>Editar camisa #{id}</h1>
            <p className={styles.subtitle}>
              Atualize os dados principais da camisa em um formulÃ¡rio adaptado para
              desktop e celular.
            </p>
          </div>

          <div className={styles.heroActions}>
            <Link href={`/camisas/${id}`} className={styles.secondaryLink}>
              Visualizar
            </Link>
            <Link href="/camisas/buscar" className={styles.secondaryLink}>
              Voltar
            </Link>
          </div>
        </header>

        <div className={styles.noticeStack}>
          {loading ? <div className={styles.infoBox}>Carregando camisa...</div> : null}
          {error ? <div className={styles.errorBox}>Erro: {error}</div> : null}
          {message ? <div className={styles.successBox}>{message}</div> : null}
        </div>

        {!loading && !error ? (
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <label className={styles.fieldWrap}>
                <span className={styles.label}>Rastreio</span>
                <input
                  id="rastreio"
                  name="rastreio"
                  value={form.rastreio ?? ''}
                  onChange={handleChange}
                  className={styles.field}
                />
              </label>

              <label className={styles.fieldWrap}>
                <span className={styles.label}>UsuÃ¡rio</span>
                <input
                  id="usuario"
                  name="usuario"
                  value={form.usuario ?? ''}
                  onChange={handleChange}
                  className={styles.field}
                />
              </label>

              <label className={`${styles.fieldWrap} ${styles.fieldWrapFull}`}>
                <span className={styles.label}>Nome</span>
                <input
                  id="nome"
                  name="nome"
                  value={form.nome ?? ''}
                  onChange={handleChange}
                  className={styles.field}
                  required
                />
              </label>

              <label className={styles.fieldWrap}>
                <span className={styles.label}>CPF</span>
                <input
                  id="cpf"
                  name="cpf"
                  value={form.cpf ?? ''}
                  onChange={handleChange}
                  className={styles.field}
                />
              </label>

              <label className={styles.fieldWrap}>
                <span className={styles.label}>Telefone</span>
                <input
                  id="telefone"
                  name="telefone"
                  value={form.telefone ?? ''}
                  onChange={handleChange}
                  className={styles.field}
                />
              </label>

              <label className={styles.fieldWrap}>
                <span className={styles.label}>Tamanho</span>
                <input
                  id="tamanho"
                  name="tamanho"
                  value={form.tamanho ?? ''}
                  onChange={handleChange}
                  className={styles.field}
                />
              </label>

              <label className={styles.fieldWrap}>
                <span className={styles.label}>Status</span>
                <select
                  id="status"
                  name="status"
                  value={form.status ?? ''}
                  onChange={handleChange}
                  className={styles.field}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Enviado">Enviado</option>
                </select>
              </label>

              <label className={`${styles.fieldWrap} ${styles.fieldWrapFull}`}>
                <span className={styles.label}>EndereÃ§o</span>
                <textarea
                  id="endereco"
                  name="endereco"
                  value={form.endereco ?? ''}
                  onChange={handleChange}
                  rows={5}
                  className={`${styles.field} ${styles.textarea}`}
                />
              </label>
            </div>

            <div className={styles.actionRow}>
              <button
                type="submit"
                disabled={saving || deleting}
                className={styles.primaryBtn}
              >
                {saving ? 'Salvando...' : 'Salvar alteraÃ§Ãµes'}
              </button>

              <button
                type="button"
                onClick={openDeleteConfirm}
                disabled={saving || deleting}
                className={styles.deleteBtn}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>

              <Link href="/camisas/buscar" className={styles.secondaryLinkAction}>
                Cancelar
              </Link>
            </div>
          </form>
        ) : null}
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
            <p className={styles.confirmEyebrow}>Confirmar exclusÃ£o</p>
            <h2 id="delete-confirm-title" className={styles.confirmTitle}>
              Excluir camisa #{id}?
            </h2>
            <p className={styles.confirmText}>
              Tem certeza que deseja excluir esta camisa? Essa aÃ§Ã£o nÃ£o pode ser
              desfeita.
            </p>

            <div className={styles.confirmActions}>
              <button
                type="button"
                onClick={closeDeleteConfirm}
                className={styles.secondaryLinkAction}
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
