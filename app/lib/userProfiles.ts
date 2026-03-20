export type UserRole = "administrativo" | "padrao";

export type HistoryEntry = {
  id: string;
  action: string;
  details: string;
  createdAt: string;
};

export type StoredUserProfile = {
  username: string;
  role: UserRole;
  permissions: string[];
  profilePhoto: string;
  history: HistoryEntry[];
};

export const PROFILE_UPDATED_EVENT = "profile-updated";
export const USER_PROFILES_STORAGE_KEY = "userProfiles";
export const LEGACY_PROFILE_PHOTO_STORAGE_KEY = "profilePhoto";
export const LEGACY_USER_PERMISSIONS_STORAGE_KEY = "userPermissions";
export const LEGACY_USER_HISTORY_STORAGE_KEY = "userHistory";

export const AVAILABLE_PERMISSIONS = [
  {
    id: "assistente_ia",
    label: "Assistente IA",
    description: "Acessa consultas e respostas da assistente.",
  },
  {
    id: "camisas_visualizar",
    label: "Visualizar camisas",
    description: "Pode abrir listagens e detalhes.",
  },
  {
    id: "camisas_editar",
    label: "Editar camisas",
    description: "Pode alterar dados e salvar registros.",
  },
  {
    id: "camisas_exportar",
    label: "Exportar dados",
    description: "Pode exportar a base de camisas.",
  },
  {
    id: "usuarios_gerenciar",
    label: "Gerenciar usuarios",
    description: "Pode editar cargos e permissoes de outros usuarios.",
  },
] as const;

function canUseStorage() {
  return typeof window !== "undefined";
}

function normalizeUsername(value: string) {
  return value.trim();
}

function getAllPermissionIds(role: UserRole) {
  if (role === "administrativo") {
    return AVAILABLE_PERMISSIONS.map((item) => item.id);
  }

  return ["assistente_ia", "camisas_visualizar"];
}

export function getCurrentUsername() {
  if (!canUseStorage()) return "";

  return (
    localStorage.getItem("usuarioLogado") ||
    sessionStorage.getItem("usuarioLogado") ||
    localStorage.getItem("user") ||
    sessionStorage.getItem("user") ||
    ""
  );
}

export function readUserProfiles(): StoredUserProfile[] {
  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(USER_PROFILES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeUserProfiles(profiles: StoredUserProfile[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(USER_PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

function readLegacyPermissions() {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(LEGACY_USER_PERMISSIONS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : null;
  } catch {
    return null;
  }
}

function readLegacyHistory() {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(LEGACY_USER_HISTORY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function appendUserHistory(profile: StoredUserProfile, action: string, details: string) {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    details,
    createdAt: new Date().toLocaleString("pt-BR"),
  };

  return {
    ...profile,
    history: [entry, ...(profile.history || [])].slice(0, 20),
  };
}

export function ensureUserProfile(usernameInput?: string) {
  if (!canUseStorage()) return null;

  const username = normalizeUsername(usernameInput || getCurrentUsername());
  if (!username) return null;

  const profiles = readUserProfiles();
  const existing = profiles.find((profile) => profile.username === username);

  if (existing) {
    return existing;
  }

  const role: UserRole =
    profiles.length === 0 || username.toLowerCase() === "admin" ? "administrativo" : "padrao";

  const createdProfile: StoredUserProfile = {
    username,
    role,
    permissions: readLegacyPermissions() || getAllPermissionIds(role),
    profilePhoto: localStorage.getItem(LEGACY_PROFILE_PHOTO_STORAGE_KEY) || "",
    history: readLegacyHistory() || [],
  };

  writeUserProfiles([...profiles, createdProfile]);
  return createdProfile;
}

export function getCurrentUserProfile() {
  return ensureUserProfile();
}

export function updateCurrentUserProfile(
  updater: (profile: StoredUserProfile) => StoredUserProfile | null
) {
  const current = getCurrentUserProfile();
  if (!current) return null;

  const nextProfile = updater(current);
  if (!nextProfile) return null;

  const profiles = readUserProfiles().map((profile) =>
    profile.username === current.username ? nextProfile : profile
  );

  writeUserProfiles(profiles);
  localStorage.setItem(LEGACY_PROFILE_PHOTO_STORAGE_KEY, nextProfile.profilePhoto || "");
  localStorage.setItem(
    LEGACY_USER_PERMISSIONS_STORAGE_KEY,
    JSON.stringify(nextProfile.permissions || [])
  );
  localStorage.setItem(LEGACY_USER_HISTORY_STORAGE_KEY, JSON.stringify(nextProfile.history || []));
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
  return nextProfile;
}

export function renameCurrentUser(newUsernameInput: string) {
  if (!canUseStorage()) return null;

  const current = getCurrentUserProfile();
  if (!current) return null;

  const newUsername = normalizeUsername(newUsernameInput) || "admin";
  const profiles = readUserProfiles();
  const nameTaken = profiles.some(
    (profile) => profile.username === newUsername && profile.username !== current.username
  );

  if (nameTaken) {
    throw new Error("Ja existe um usuario com esse nome.");
  }

  let nextProfile = {
    ...current,
    username: newUsername,
  };

  if (current.username !== newUsername) {
    nextProfile = appendUserHistory(
      nextProfile,
      "Nome atualizado",
      `O nome foi alterado de "${current.username}" para "${newUsername}".`
    );
  }

  const nextProfiles = profiles.map((profile) =>
    profile.username === current.username ? nextProfile : profile
  );

  writeUserProfiles(nextProfiles);
  localStorage.setItem("usuarioLogado", newUsername);
  localStorage.setItem("user", newUsername);

  if (sessionStorage.getItem("usuarioLogado")) {
    sessionStorage.setItem("usuarioLogado", newUsername);
  }

  if (sessionStorage.getItem("user")) {
    sessionStorage.setItem("user", newUsername);
  }

  localStorage.setItem(LEGACY_PROFILE_PHOTO_STORAGE_KEY, nextProfile.profilePhoto || "");
  localStorage.setItem(
    LEGACY_USER_PERMISSIONS_STORAGE_KEY,
    JSON.stringify(nextProfile.permissions || [])
  );
  localStorage.setItem(LEGACY_USER_HISTORY_STORAGE_KEY, JSON.stringify(nextProfile.history || []));
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
  return nextProfile;
}

export function saveCurrentUserPhoto(photo: string) {
  return updateCurrentUserProfile((profile) =>
    appendUserHistory(
      {
        ...profile,
        profilePhoto: photo,
      },
      "Foto atualizada",
      "A foto de perfil foi trocada."
    )
  );
}

export function removeCurrentUserPhoto() {
  const updated = updateCurrentUserProfile((profile) =>
    appendUserHistory(
      {
        ...profile,
        profilePhoto: "",
      },
      "Foto removida",
      "A foto de perfil foi removida."
    )
  );

  if (updated) {
    localStorage.removeItem(LEGACY_PROFILE_PHOTO_STORAGE_KEY);
  }

  return updated;
}

export function isCurrentUserAdmin() {
  const current = getCurrentUserProfile();
  return current?.role === "administrativo";
}

export function updateManagedUser(
  targetUsername: string,
  updates: Partial<Pick<StoredUserProfile, "permissions" | "role">>,
  actorUsername: string
) {
  const profiles = readUserProfiles();
  const target = profiles.find((profile) => profile.username === targetUsername);
  if (!target) return null;

  let nextProfile: StoredUserProfile = {
    ...target,
    ...updates,
  };

  if (updates.role && updates.role !== target.role) {
    nextProfile = appendUserHistory(
      nextProfile,
      "Cargo atualizado",
      `Cargo alterado para ${updates.role} por ${actorUsername}.`
    );
  }

  if (updates.permissions) {
    const names = AVAILABLE_PERMISSIONS.filter((item) =>
      updates.permissions?.includes(item.id)
    )
      .map((item) => item.label)
      .join(", ");

    nextProfile = appendUserHistory(
      nextProfile,
      "Permissoes atualizadas",
      names
        ? `Permissoes definidas por ${actorUsername}: ${names}.`
        : `Todas as permissoes foram removidas por ${actorUsername}.`
    );
  }

  const nextProfiles = profiles.map((profile) =>
    profile.username === targetUsername ? nextProfile : profile
  );
  writeUserProfiles(nextProfiles);

  const current = getCurrentUserProfile();
  if (current?.username === targetUsername) {
    localStorage.setItem(
      LEGACY_USER_PERMISSIONS_STORAGE_KEY,
      JSON.stringify(nextProfile.permissions || [])
    );
  }

  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
  return nextProfile;
}
