'use client';

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./aranha.module.css";

export default function Aranha() {
  const spiderRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const spider = spiderRef.current;
    if (!spider) return;

    let posX = window.innerWidth / 2;
    let posY = window.innerHeight / 2;

    spider.style.left = `${posX}px`;
    spider.style.top = `${posY}px`;

    const teleport = () => {
      const w = spider.offsetWidth;
      const h = spider.offsetHeight;

      posX = Math.random() * Math.max(window.innerWidth - w, 0);
      posY = Math.random() * Math.max(window.innerHeight - h, 0);

      spider.style.left = `${posX}px`;
      spider.style.top = `${posY}px`;
    };

    const handleMouseMove = (event: MouseEvent) => {
      const dx = posX - event.clientX;
      const dy = posY - event.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance === 0 || distance >= 200) return;

      const force = 40;
      posX += (dx / distance) * force;
      posY += (dy / distance) * force;

      const w = spider.offsetWidth;
      const h = spider.offsetHeight;

      const hitWall =
        posX <= 0 ||
        posX >= window.innerWidth - w ||
        posY <= 0 ||
        posY >= window.innerHeight - h;

      if (hitWall) {
        teleport();
        return;
      }

      spider.style.left = `${posX}px`;
      spider.style.top = `${posY}px`;
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>
          <span>Voltar ao menu? Pegue a aranha!</span>
          <button
            type="button"
            className={styles.titleSpider}
            onClick={() => router.push("/")}
            aria-label="Sair pela aranha do titulo"
          >
            🕷️
          </button>
        </h1>

        <button type="button" className={styles.noButton}>
          Não
        </button>
      </header>

      <div
        ref={spiderRef}
        onClick={() => router.push("/")}
        className={styles.runnerSpider}
        title="Saída pela habilidade"
        role="button"
        aria-label="Aranha que foge"
      >
        🕷️
      </div>
    </main>
  );
}
