'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Funnel_Sans } from 'next/font/google';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faUsersGear } from '@fortawesome/free-solid-svg-icons';
import SidebarAdmin from '../components/SidebarAdmin';
import styles from './usuarios-admin.module.css';
import {
  AVAILABLE_PERMISSIONS,
  PROFILE_UPDATED_EVENT,
  StoredUserProfile,
  getCurrentUserProfile,
  isCurrentUserAdmin,
  readUserProfiles,
  updateManagedUser,
} from '@/lib/userProfiles';

const fn = Funnel_Sans({ subsets: ['latin'], weight: '400' });

export default function UsuariosAdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [users, setUsers] = useState<StoredUserProfile[]>([]);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<'administrativo' | 'padrao'>('padrao');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
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

    function syncUsers() {
      const profiles = readUserProfiles();
      const admin = isCurrentUserAdmin();
      setUsers(profiles);
      setCanManage(Boolean(admin));
      setAuthorized(true);

      if (profiles.length > 0) {
        const selected =
          profiles.find((item) => item.username === selectedUsername) ||
          profiles[0];
        setSelectedUsername(selected.username);
        setSelectedRole(selected.role);
        setSelectedPermissions(selected.permissions || []);
      }
    }

    syncUsers();
    window.addEventListener(PROFILE_UPDATED_EVENT, syncUsers);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, syncUsers);
    };
  }, [router, selectedUsername]);

  const selectedUser = useMemo(
    () => users.find((user) => user.username === selectedUsername) || null,
    [selectedUsername, users]
  );

  useEffect(() => {
    if (!selectedUser) return;
    setSelectedRole(selectedUser.role);
    setSelectedPermissions(selectedUser.permissions || []);
  }, [selectedUser]);

  function handlePermissionToggle(permissionId: string) {
    setSelectedPermissions((current) =>
      current.includes(permissionId)
        ? current.filter((item) => item !== permissionId)
        : [...current, permissionId]
    );
  }

  function handleSave() {
    if (!selectedUser) return;

    const actor = getCurrentUserProfile()?.username || 'admin';
    updateManagedUser(
      selectedUser.username,
      {
        role: selectedRole,
        permissions: selectedPermissions,
      },
      actor
    );
    setStatusMessage('Permissoes e cargo atualizados com sucesso.');
  }

  if (!authorized) {
    return null;
  }

  if (!canManage) {
    return (
      <main className={`${styles.page} ${fn.className}`}>
        <SidebarAdmin />

        <section className={styles.content}>
          <div className={styles.blockedCard}>
            <span className={styles.heroBadge}>
              <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
              Acesso restrito
            </span>
            <h1>Area administrativa de usuarios</h1>
            <p>Somente perfis com cargo administrativo podem acessar esta pagina.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`${styles.page} ${fn.className}`}>
      <SidebarAdmin />

      <section className={styles.content}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <span className={styles.heroBadge}>
              <FontAwesomeIcon icon={faUsersGear} aria-hidden="true" />
              Administracao
            </span>
            <h1>Editar usuarios</h1>
            <p>
              Esta area usa armazenamento local apenas para desenvolvimento. Hoje o usuario atual sera o
              unico cadastro inicial, mas a estrutura ja fica pronta para o acoplamento futuro.
            </p>
          </header>

          <div className={styles.layout}>
            <aside className={styles.userListCard}>
              <h2>Usuarios locais</h2>
              <div className={styles.userList}>
                {users.map((user) => (
                  <button
                    key={user.username}
                    type="button"
                    className={`${styles.userItem} ${
                      user.username === selectedUsername ? styles.userItemActive : ''
                    }`}
                    onClick={() => setSelectedUsername(user.username)}
                  >
                    <strong>{user.username}</strong>
                    <span>{user.role === 'administrativo' ? 'Administrativo' : 'Padrao'}</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className={styles.editorCard}>
              {selectedUser ? (
                <>
                  <div className={styles.editorHeader}>
                    <div>
                      <span className={styles.sectionLabel}>Usuario selecionado</span>
                      <h2>{selectedUser.username}</h2>
                    </div>
                    <span className={styles.statusText}>{statusMessage || 'Pronto para editar'}</span>
                  </div>

                  <label className={styles.field}>
                    <span>Cargo</span>
                    <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as 'administrativo' | 'padrao')}>
                      <option value="administrativo">Administrativo</option>
                      <option value="padrao">Padrao</option>
                    </select>
                  </label>

                  <div className={styles.permissionSection}>
                    <div className={styles.sectionTop}>
                      <span className={styles.sectionLabel}>Permissoes</span>
                      <p>Defina o que este usuario pode acessar.</p>
                    </div>

                    <div className={styles.permissionList}>
                      {AVAILABLE_PERMISSIONS.map((permission) => (
                        <label key={permission.id} className={styles.permissionCard}>
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                          />
                          <div>
                            <strong>{permission.label}</strong>
                            <p>{permission.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="button" className={styles.saveBtn} onClick={handleSave}>
                    Salvar alteracoes
                  </button>
                </>
              ) : (
                <div className={styles.emptyState}>Nenhum usuario local encontrado.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
