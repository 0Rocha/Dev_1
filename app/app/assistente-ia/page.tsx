'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Funnel_Sans } from 'next/font/google';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faPaperPlane, faShirt } from '@fortawesome/free-solid-svg-icons';
import SidebarAdmin from '../components/SidebarAdmin';
import styles from './assistente.module.css';

const fn = Funnel_Sans({ subsets: ['latin'], weight: '400' });

type AskResponse = {
  ok?: boolean;
  answer?: string;
  error?: string;
  contextMode?: string;
  usedRows?: number;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  meta?: string;
};

export default function AssistenteIaPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      return;
    }

    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const trimmedQuestion = useMemo(() => question.trim(), [question]);

  async function submitQuestion(text: string) {
    const cleanedQuestion = text.trim();

    if (!cleanedQuestion || loading) {
      return;
    }

    setLoading(true);
    setError('');
    setQuestion('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanedQuestion,
    };

    setMessages((current) => [...current, userMessage]);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: cleanedQuestion }),
      });

      const data: AskResponse = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Falha ao consultar a assistente (${res.status})`);
      }

      const parts: string[] = [];
      if (data.contextMode) parts.push(String(data.contextMode));
      if (typeof data.usedRows === 'number') parts.push(`${data.usedRows} camisas no contexto`);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: String(data.answer || ''),
        meta: parts.join(' • '),
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel consultar a assistente agora.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(trimmedQuestion);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitQuestion(trimmedQuestion);
    }
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
            <div className={styles.heroBadge}>
              <FontAwesomeIcon icon={faCommentDots} aria-hidden="true" />
              Assistente IA
            </div>
            <div className={styles.heroBody}>
              <div>
                <h1>Conversa inteligente sobre as camisas</h1>
                <p>
                  Consulte tamanhos, status, IDs e dados da base em um chat mais direto. Enter envia e
                  Shift+Enter cria uma nova linha.
                </p>
              </div>

              <div className={styles.heroCard}>
                <span className={styles.heroCardLabel}>Atalhos uteis</span>
                <strong>qual a maior camisa?</strong>
                <strong>quais as maiores camisas?</strong>
                <strong>qual a menor camisa?</strong>
              </div>
            </div>
          </header>

          <div className={styles.chatShell}>
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <div className={styles.assistantAvatar}>
                  <FontAwesomeIcon icon={faShirt} aria-hidden="true" />
                </div>
                <div>
                  <strong>Assistente de camisas</strong>
                  <span>Respostas baseadas nos registros disponiveis</span>
                </div>
              </div>
              <span className={styles.chatStatus}>{loading ? 'Consultando base...' : 'Online'}</span>
            </div>

            <div className={styles.chatMessages}>
              {messages.length === 0 ? (
                <div className={styles.emptyState}>
                  Nenhuma mensagem ainda. Pergunte algo como &quot;qual a maior camisa?&quot; ou
                  &quot;quais as maiores camisas?&quot;.
                </div>
              ) : null}

              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`${styles.messageRow} ${
                    message.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className={styles.inlineAvatar}>
                      <FontAwesomeIcon icon={faShirt} aria-hidden="true" />
                    </div>
                  ) : null}

                  <div
                    className={`${styles.messageBubble} ${
                      message.role === 'user' ? styles.messageUser : styles.messageAssistant
                    }`}
                  >
                    <span className={styles.messageLabel}>
                      {message.role === 'user' ? 'Voce' : 'Assistente'}
                    </span>
                    <p className={styles.messageBody}>{message.text}</p>
                    {message.meta ? <span className={styles.messageMeta}>{message.meta}</span> : null}
                  </div>
                </article>
              ))}

              {loading ? (
                <article className={`${styles.messageRow} ${styles.messageRowAssistant}`}>
                  <div className={styles.inlineAvatar}>
                    <FontAwesomeIcon icon={faShirt} aria-hidden="true" />
                  </div>
                  <div className={`${styles.messageBubble} ${styles.messageAssistant}`}>
                    <span className={styles.messageLabel}>Assistente</span>
                    <p className={styles.messageBody}>Consultando os dados e preparando a resposta...</p>
                  </div>
                </article>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            <form className={styles.chatComposer} onSubmit={handleSubmit}>
              <div className={styles.composerInputWrap}>
                <textarea
                  className={styles.questionField}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                />
              </div>

              <div className={styles.composerActions}>
                <span className={styles.meta}>{loading ? 'Consultando...' : 'Enter envia'}</span>
                <button type="submit" className={styles.submitBtn} disabled={loading || !trimmedQuestion}>
                  <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
