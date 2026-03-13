"use client"; // Faz o componente rodar no cliente — necessário para hooks e usePathname()
import { Trade_Winds } from 'next/font/google';
// React hooks usados
import { useState, useMemo } from "react"; // useState: estado local; useMemo: memoizar valores pesados
import Link from "next/link"; // Link do Next.js para navegação interna (pré-carregamento)
import { usePathname } from "next/navigation"; // Hook Next para obter a rota atual (pathname)
// FontAwesome: componente e ícones usados nesta sidebar
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignInAlt,
  faFileLines,
  faUsers,
  faFolder,
  faShoppingBag,
  faTags,
  faThLarge,
  faChartBar,
} from '@fortawesome/free-solid-svg-icons';

import styles from "./SidebarAdmin.module.css";; // CSS Modules: evita colisão de classes globais

const tradeWinds = Trade_Winds({ subsets: ['latin'], weight: '400' });


  


// Componente principal da sidebar — recebe className opcional para composição
export default function SidebarAdmin({ className = "" }) {
  // pathname atual da rota — usado para marcar item ativo
  const pathname = usePathname() || "/"; // fallback para "/" caso undefined
 
  // Estado do campo de busca (filtro de menus)
  const [filter, setFilter] = useState(""); // string do input de busca////////////

  // Controle de quais grupos (colapsáveis) estão abertos
  const [open, setOpen] = useState({
  });

  // Estrutura do menu memoizada para não recriar o array em cada render
  const menuStructure = useMemo(
    () => [
      // Item simples (link de nível superior)
      { id: "logout", label: "Logout", href: "/", icon: faSignInAlt },

 

      // Seção: Loja e Vendas (contém itens que podem ter children / submenu)
      {
        id: "loja-group",
        section: "Loja",
        items: [
          {
            id: "Camisas",
            label: "Camisas",
            icon: faShoppingBag,
            // children = submenu (cada child tem id, label e href)
            children: [
              { id: "Camisas-buscar", label: "Buscar", href: "/camisas/buscar" },
              { id: "Camisas-listar", label: "Listar", href: "/camisas" },
            ],
          },
        ],
      },

    ],
    [] // dependência vazia → calculado apenas na primeira render
  );

  // Alterna o estado de abertura (open) para o grupo passado (ex: 'loja' ou 'cadastros')
  const toggle = (key) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  // Função utilitária que verifica se um texto corresponde ao filtro atual
  // Normaliza para minúsculas e remove espaços em excesso ao redor
  const matchesFilter = (text) =>
    text.toLowerCase().includes(filter.trim().toLowerCase());

  return (
    // Wrapper principal: aside com classes de CSS module e className externo opcional
    <aside className={`${styles.sidebar} ${className} ${tradeWinds.className}`}>
      {/* Topo / marca */}
      <div className={styles.brand}>
        <div className={styles.brandName}>LUCI | LUCI</div> {/* Nome da marca */}
        <div className={styles.brandSub}></div> {/* Subtítulo */}
      </div>

      {/* Área interna que contém filtro e navegação */}
      <div className={styles.container}>
        {/* Input de filtro -> ligado ao estado `filter` */}
        <input
          aria-label="Filtrar Menus" // acessibilidade: rótulo para leitores de tela////////////////
          placeholder=" Filtrar "
          value={filter}
          onChange={(e) => setFilter(e.target.value)} // atualiza estado a cada tecla
          className={styles.filterInput}
        />

        {/* Navegação principal */}
        <nav role="navigation" aria-label="Sidebar de administração">
          {/* Renderiza entradas que NÃO são seções (top-level simples) */}
          {menuStructure.map((entry) => {
            if (entry.section) return null; // pula se for seção; será renderizada abaixo
            const active = pathname === entry.href; // checagem de ativo (exata)
            if (filter && !matchesFilter(entry.label)) return null; // esconde se não bater no filtro

            return (
              // Link de nível superior
              <Link
                key={entry.id}
                href={entry.href}
                className={`${styles.menuItem} ${active ? styles.active : ""}`}
                aria-current={active ? "page" : undefined} // indica link atual para ATs
              >
                {entry.icon && (
                  <FontAwesomeIcon
                    icon={entry.icon}
                    className={styles.menuItemIcon}
                    aria-hidden="true"
                  />
                )}
                <span>{entry.label}</span>
              </Link>
            );
          })}

          {/* Agora renderiza as seções (cada seção tem título e items) */}
          {menuStructure.filter((e) => e.section) // pega só as entradas que definem uma seção
            .map((section) => (
              <div key={section.id} className={styles.sectionBlock}>
                <h3 className={styles.sectionTitle}>{section.section}</h3> {/* Título da seção */}

                {/* Itera itens da seção */}
                {section.items.map((it) => {
                  // Caso o item possua children -> botão colapsável com submenu
                  if (it.children) {
                    // OBS: aqui inferimos groupKey com base no nome da seção. Isso é prático,
                    // mas frágil se você adicionar seções novas — ver TODO abaixo.
                    const groupKey = section.section.toLowerCase().includes("cadastros")
                      ? "cadastros"
                      : "loja";
                    const isOpen = open[groupKey]; // verifica se o grupo está aberto

                    // Verifica se pelo menos um child bate com o filtro
                    const childrenMatch = it.children.some((c) => matchesFilter(c.label));
                    // Se há filtro e nem o pai nem os filhos batem, esconde o bloco
                    if (filter && !matchesFilter(it.label) && !childrenMatch) return null;

                    return (
                      <div key={it.id}>
                        {/* botão que abre/fecha o submenu */}
                        <button
                          type="button"
                          onClick={() => toggle(groupKey)} // alterna o grupo
                          className={`${styles.menuItem} ${styles.menuButton}`}
                          aria-expanded={isOpen} // acessibilidade: indica estado expandido
                          aria-controls={`${it.id}-submenu`} // vincula ao submenu
                        >
                          {it.icon && (
                            <FontAwesomeIcon
                              icon={it.icon}
                              className={styles.menuItemIcon}
                              aria-hidden="true"
                            />
                          )}
                          <span>{it.label}</span>
                          <span className={styles.toggle}>{isOpen ? "▾" : "▸"}</span> {/* seta visual */}
                        </button>

                        {/* Submenu: renderiza apenas se isOpen true */}
                        {isOpen && (
                          <div id={`${it.id}-submenu`} className={styles.submenu}>
                            {it.children.map((child) => {
                              if (filter && !matchesFilter(child.label)) return null; // aplica filtro nos filhos
                              const active = pathname === child.href; // marca ativo (checa igualdade exata)
                              return (
                                <Link
                                  key={child.id}
                                  href={child.href}
                                  className={`${styles.submenuItem} ${active ? styles.subActive : ""}`}
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
                  }

                 
                })}
              </div>
            ))}
        </nav>
      </div>
    </aside>
  );
}

/*
  ---------------------------
  NOTAS IMPORTANTES / SUGESTÕES
  ---------------------------
  - A checagem `pathname === href` é exata: pode não marcar itens pais para rotas aninhadas
    (ex: pathname "/camisas/listar" não marca "/camisas"). Se quiser marcar pais, usar startsWith
    ou normalizar trailing slash (ex: remove / final).
  - A inferência de groupKey por texto da seção é frágil. Melhor adicionar `groupKey` diretamente
    em cada objeto de seção na `menuStructure`.
  - O filtro não tem debounce — para menus gigantes, adicionar debounce (ex: 150ms) para reduzir renders.
  - Foi adicionado aria-controls e aria-current para melhorar acessibilidade.
  - O código pode ser refatorado para extrair componentes menores (ex: MenuItem, SubMenu) para melhor legibilidade.
*/