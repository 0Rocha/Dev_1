'use client';

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Aranha() {
  const spiderRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const spider = spiderRef.current;
    if (!spider) return;

    let posX = window.innerWidth / 2;
    let posY = window.innerHeight / 2;

    spider.style.left = posX + "px";
    spider.style.top = posY + "px";

    const teleport = () => {
      const w = spider.offsetWidth;
      const h = spider.offsetHeight;

      posX = Math.random() * (window.innerWidth - w);
      posY = Math.random() * (window.innerHeight - h);

      spider.style.left = posX + "px";
      spider.style.top = posY + "px";
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = posX - e.clientX;
      const dy = posY - e.clientY;

      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 200) {
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
        } else {
          spider.style.left = posX + "px";
          spider.style.top = posY + "px";
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        background: "#ffffff",
      }}
    >
      {/* Pergunta */}
      <div
        style={{
          position: "fixed",
          top: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "28px",
          fontWeight: "bold",
        }}
      >
        
        Voltar ao menu? Pegue a aranha!   ️
      </div>

      {/* Botão NÃO */}
      <button
        style={{
          position: "fixed",
          top: "150px",
          left: "50%",
          transform: "translateX(-120%)",
          padding: "10px 20px",
          fontSize: "18px",
          cursor: "pointer",
        }}
      >
        Não
      </button>

      {/* Aranha = SIM */}
      <div
        ref={spiderRef}
        onClick={() => router.push("/")} 
        style={{
          position: "fixed",
          fontSize: "60px",
          cursor: "pointer",
          transition: "all 0.1s linear",
        }}
        title="Sim 😈"
      >
        🕷️
      </div>

      <div
  onClick={() => router.push("/")}
  style={{
    position: "fixed",
    bottom: "620px",
    right: "530px",
    fontSize: "30px",
    cursor: "pointer",
  }}
 
>
   🕷
</div>
    </main>
  );
}