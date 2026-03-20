'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Funnel_Sans } from 'next/font/google';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faClockRotateLeft,
  faShieldHalved,
  faTrashCan,
  faUserPen,
} from '@fortawesome/free-solid-svg-icons';
import SidebarAdmin from '../components/SidebarAdmin';
import styles from './usuario.module.css';
import {
  AVAILABLE_PERMISSIONS,
  PROFILE_UPDATED_EVENT,
  getCurrentUserProfile,
  removeCurrentUserPhoto,
  renameCurrentUser,
  saveCurrentUserPhoto,
} from '@/lib/userProfiles';

const fn = Funnel_Sans({ subsets: ['latin'], weight: '400' });

export default function PerfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [username, setUsername] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [history, setHistory] = useState<
    { id: string; camisa_id: number; acao: string; usuario_nome: string; alterado_em: string }[]
  >([]);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const localAuth = localStorage.getItem('auth');
    const sessionAuth = sessionStorage.getItem('auth');
    const localUser = localStorage.getItem('usuarioLogado') || localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('usuarioLogado') || sessionStorage.getItem('user');

    if ((localAuth !== 'true' && sessionAuth !== 'true') || (!localUser && !sessionUser)) {
      localStorage.removeItem('auth');
      localStorage.removeItem('user');
      localStorage.removeItem('usuarioLogado');
      sessionStorage.removeItem('auth');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('usuarioLogado');
      router.push('/');
      return;
    }

    function syncProfile() {
      const profile = getCurrentUserProfile();
      if (!profile) return;

      setUsername(profile.username);
      setProfilePhoto(profile.profilePhoto || '');
      setPermissions(profile.permissions || []);
      setAuthorized(true);
    }

    syncProfile();
    window.addEventListener(PROFILE_UPDATED_EVENT, syncProfile);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, syncProfile);
    };
  }, [router]);

  useEffect(() => {
    if (!authorized || !username.trim()) return;

    let active = true;

    async function loadHistory() {
      try {
        const res = await fetch(`/api/usuario/historico?usuario=${encodeURIComponent(username.trim())}`, {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => null);

        if (!active || !res.ok || !data?.ok) {
          setHistory([]);
          return;
        }

        setHistory(Array.isArray(data.history) ? data.history : []);
      } catch {
        if (!active) return;
        setHistory([]);
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, [authorized, username]);

  const initials = useMemo(() => {
    return (username || 'admin').trim().slice(0, 2).toUpperCase();
  }, [username]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      renameCurrentUser(username);
      setStatusMessage('Dados do perfil atualizados com sucesso.');
    } catch (error: any) {
      setStatusMessage(error?.message || 'Nao foi possivel atualizar o perfil.');
    }
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      event.target.value = '';
      setStatusMessage('Selecione um arquivo de imagem valido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      saveCurrentUserPhoto(result);
      setStatusMessage('Foto de perfil atualizada com sucesso.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function handleRemovePhoto() {
    removeCurrentUserPhoto();
    setStatusMessage('Foto de perfil removida.');
  }

  if (!authorized) {
    return null;
  }

  return (
    <main className={`${styles.page} ${fn.className}`}>
      <SidebarAdmin />

      <section className={styles.content}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <span className={styles.heroBadge}>
              <FontAwesomeIcon icon={faUserPen} aria-hidden="true" />
              Perfil
            </span>
            <h1>Editar perfil</h1>
            <p>Atualize nome, foto e acompanhe o historico das acoes feitas por este usuario no servidor. As permissoes abaixo sao apenas de leitura.</p>
          </header>

          <div className={styles.layout}>
            <div className={styles.card}>
              <div className={styles.preview}>
                <div className={styles.avatar}>
                  {profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profilePhoto} alt="Foto de perfil" className={styles.avatarImage} />
                  ) : (
                    <span className={styles.avatarFallback}>{initials}</span>
                  )}
                </div>

                <div className={styles.previewText}>
                  <span className={styles.previewLabel}>Visualizacao</span>
                  <strong>{username.trim() || 'admin'}</strong>
                  <p>{profilePhoto ? 'Foto personalizada ativa.' : 'Sem foto personalizada no momento.'}</p>
                </div>
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.field}>
                  <span>Nome do perfil</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Digite o nome do perfil"
                  />
                </label>

                <div className={styles.photoActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FontAwesomeIcon icon={faCamera} aria-hidden="true" />
                    Trocar foto
                  </button>

                  <button
                    type="button"
                    className={styles.dangerBtn}
                    onClick={handleRemovePhoto}
                    disabled={!profilePhoto}
                  >
                    <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                    Remover foto
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handlePhotoChange}
                  />
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionBadge}>
                      <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
                      Permissoes
                    </span>
                    <p>Somente usuarios com cargo administrativo podem alterar permissoes.</p>
                  </div>

                  <div className={styles.permissionList}>
                    {AVAILABLE_PERMISSIONS.map((permission) => {
                      const checked = permissions.includes(permission.id);

                      return (
                        <div key={permission.id} className={styles.permissionCardReadOnly}>
                          <div>
                            <strong>{permission.label}</strong>
                            <p>{permission.description}</p>
                          </div>
                          <span className={styles.permissionStatus}>{checked ? 'Ativa' : 'Inativa'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.footer}>
                  <span className={styles.status}>
                    {statusMessage || 'As alteracoes ficam salvas neste navegador.'}
                  </span>
                  <button type="submit" className={styles.primaryBtn}>
                    Salvar perfil
                  </button>
                </div>
              </form>
            </div>

            <aside className={styles.historyCard}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionBadge}>
                  <FontAwesomeIcon icon={faClockRotateLeft} aria-hidden="true" />
                  Historico
                </span>
                <p>Ultimas acoes registradas no servidor para este usuario.</p>
              </div>

              <div className={styles.historyList}>
                {history.length === 0 ? (
                  <div className={styles.emptyHistory}>Nenhuma acao de servidor encontrada para este usuario.</div>
                ) : (
                  history.map((entry) => (
                    <article key={entry.id} className={styles.historyItem}>
                      <strong>{entry.acao}</strong>
                      <p>Camisa #{entry.camisa_id} alterada por {entry.usuario_nome || 'desconhecido'}.</p>
                      <span>{new Date(entry.alterado_em).toLocaleString('pt-BR')}</span>
                    </article>
                  ))
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
