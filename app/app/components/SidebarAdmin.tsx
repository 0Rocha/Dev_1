"use client";

import { Trade_Winds } from "next/font/google";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faPen,
  faRightFromBracket,
  faShirt,
} from "@fortawesome/free-solid-svg-icons";
import {
  PROFILE_UPDATED_EVENT,
  getCurrentUserProfile,
  isCurrentUserAdmin,
} from "@/lib/userProfiles";
import styles from "./SidebarAdmin.module.css";

const tradeWinds = Trade_Winds({ subsets: ["latin"], weight: "400" });

export default function SidebarAdmin({ className = "" }) {
  const pathname = usePathname() || "/";
  const router = useRouter();

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [usuarioLogado, setUsuarioLogado] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiLabel, setAiLabel] = useState("Assistente IA offline");

  const aiPageActive = pathname === "/assistente-ia";
  const profilePageActive = pathname === "/usuario";
  const adminUsersPageActive = pathname === "/usuarios-admin";

  useEffect(() => {
    function syncProfile() {
      const profile = getCurrentUserProfile();
      setUsuarioLogado(profile?.username || "");
      setProfilePhoto(profile?.profilePhoto || "");
      setIsAdmin(isCurrentUserAdmin());
    }

    syncProfile();
    window.addEventListener(PROFILE_UPDATED_EVENT, syncProfile);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, syncProfile);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAiStatus() {
      try {
        const res = await fetch("/api/ai/status", { cache: "no-store" });
        const data = await res.json().catch(() => null);

        if (!active || !res.ok || !data?.ok) return;

        setAiConfigured(Boolean(data.configured));
        setAiLabel(String(data.label || "Assistente IA offline"));
      } catch {
        if (!active) return;
        setAiConfigured(false);
        setAiLabel("Assistente IA offline");
      }
    }

    loadAiStatus();

    return () => {
      active = false;
    };
  }, []);

  const menuStructure = useMemo(
    () => [
      {
        id: "loja-group",
        section: "Loja",
        items: [
          {
            id: "Camisas",
            label: "Camisas",
            icon: faShirt,
            children: [
              { id: "Camisas-buscar", label: "Buscar", href: "/camisas/buscar" },
              { id: "Camisas-listar", label: "Listar", href: "/camisas" },
            ],
          },
        ],
      },
    ],
    []
  );

  function handleLogout() {
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    localStorage.removeItem("usuarioLogado");

    sessionStorage.removeItem("auth");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("usuarioLogado");

    router.push("/");
    router.refresh();
  }

  const toggle = (key: string) => setOpen((s) => ({ ...s, [key]: !s[key] }));
  const initials = (usuarioLogado || "admin").trim().slice(0, 2).toUpperCase();

  return (
    <aside className={`${styles.sidebar} ${className} ${tradeWinds.className}`}>
      <div className={styles.brand}>
        <div className={styles.brandName}>LUCI | LUCI</div>
        <div className={styles.brandSub}></div>
      </div>

      <div className={styles.container}>
        <nav role="navigation" aria-label="Sidebar de administracao">
          <button type="button" onClick={handleLogout} className={styles.menuItem}>
            <FontAwesomeIcon
              icon={faRightFromBracket}
              className={styles.menuItemIcon}
              aria-hidden="true"
            />
            <span>Logout</span>
          </button>

          {menuStructure.map((section) => (
            <div key={section.id} className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>{section.section}</h3>

              {section.items.map((it) => {
                if (!it.children) return null;

                const groupKey = section.section.toLowerCase().includes("cadastros")
                  ? "cadastros"
                  : "loja";

                const isOpen = open[groupKey];

                return (
                  <div key={it.id}>
                    <button
                      type="button"
                      onClick={() => toggle(groupKey)}
                      className={`${styles.menuItem} ${styles.menuButton}`}
                      aria-expanded={isOpen}
                      aria-controls={`${it.id}-submenu`}
                    >
                      <div className={styles.menuButtonLeft}>
                        {it.icon && (
                          <FontAwesomeIcon
                            icon={it.icon}
                            className={styles.menuItemIcon}
                            aria-hidden="true"
                          />
                        )}
                        <span>{it.label}</span>
                      </div>

                      <span className={styles.toggle}>{isOpen ? "v" : ">"}</span>
                    </button>

                    {isOpen && (
                      <div id={`${it.id}-submenu`} className={styles.submenu}>
                        {it.children.map((child) => {
                          const active = pathname === child.href;

                          return (
                            <Link
                              key={child.id}
                              href={child.href}
                              className={`${styles.submenuItem} ${
                                active ? styles.subActive : ""
                              }`}
                              aria-current={active ? "page" : undefined}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.userHello}>
          <div className={styles.userHeader}>
            <div className={styles.avatarWrap}>
              {profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profilePhoto} alt="Foto de perfil" className={styles.avatarImage} />
              ) : (
                <span className={styles.avatarFallback}>{initials}</span>
              )}
            </div>

            <div className={styles.userText}>
              <span className={styles.userGreeting}>Olá, </span>
              <strong>{usuarioLogado || "admin"}</strong>
            </div>
          </div>

          <Link
            href="/assistente-ia"
            className={`${styles.aiStatus} ${aiPageActive ? styles.aiStatusActive : ""}`}
            aria-current={aiPageActive ? "page" : undefined}
          >
            <span
              className={`${styles.aiDot} ${
                aiConfigured ? styles.aiDotOnline : styles.aiDotOffline
              }`}
              aria-hidden="true"
            />
            {aiLabel}
          </Link>

          <Link
            href="/usuario"
            className={`${styles.profileLink} ${profilePageActive ? styles.profileLinkActive : ""}`}
            aria-current={profilePageActive ? "page" : undefined}
          >
            <FontAwesomeIcon icon={faPen} aria-hidden="true" />
            Perfil
          </Link>

          {isAdmin ? (
            <Link
              href="/usuarios-admin"
              className={`${styles.profileLink} ${
                adminUsersPageActive ? styles.profileLinkActive : ""
              }`}
              aria-current={adminUsersPageActive ? "page" : undefined}
            >
              <FontAwesomeIcon icon={faLock} aria-hidden="true" />
              Usuarios
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
