"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Funnel_Sans } from "next/font/google";
import styles from "./page.module.css";
import SidebarAdmin from "./components/SidebarAdmin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserLock } from "@fortawesome/free-solid-svg-icons";

const funnelSans = Funnel_Sans({ subsets: ["latin"], weight: "400" });

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Preencha usuário e senha.");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao fazer login.");
        return;
      }

      router.push("/pedidos");
    } catch (err) {
      console.error(err);
      setError("Não foi possível conectar ao servidor.");
    }
  }

  return (
    <main
      className={funnelSans.className}
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        color: "#000000",
      }}
    >
      <div className={styles.sidebarHidden}>
        <SidebarAdmin />
      </div>

      <section className={styles.loginWrapper}>
        <div className={styles.loginCard} role="main" aria-labelledby="loginTitle">
          <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FontAwesomeIcon icon={faUserLock} size="lg" />
            <h1 id="loginTitle" style={{ margin: 0 }}>
              Entrar
            </h1>
          </header>

          <p className={styles.breadcrumb}>Faça login para continuar</p>

          <form onSubmit={handleSubmit} className={styles.loginForm} noValidate>
            <label htmlFor="username" className={styles.formLabel}>
              Usuário
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="usuario"
              required
              aria-required="true"
            />

            <label htmlFor="password" className={styles.formLabel}>
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              aria-required="true"
            />

            <div className={styles.rowBetween}>
              <label className={styles.rememberLabel}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />{" "}
                Lembrar
              </label>

              <Link href="/recuperar-senha" className={styles.footerLink}>
                Esqueceu a senha?
              </Link>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.btn}>
              Entrar
            </button>

            <div className={styles.signup}>
              Não tem conta?{" "}
              <Link href="/registro" className={styles.footerLink}>
                Criar conta
              </Link>
            </div>
          </form>
        </div>

        <div className={styles.simpleSpider}>
          <div className={styles.spider}>
            <div className={styles.web}></div>
            <Link href="/aranha" style={{ textDecoration: "none" }}>
              🕷️
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}