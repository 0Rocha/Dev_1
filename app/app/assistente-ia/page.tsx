'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Funnel_Sans } from 'next/font/google';
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

const EXAMPLE_QUESTIONS = [
  'Quais camisas estao com status pendente?',
 
  'Me diga os dados da camisa de ID 12.',
];

export default function AssistenteIaPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState('');

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

  const trimmedQuestion = useMemo(() => question.trim(), [question]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedQuestion) {
      setError('Escreva uma pergunta para consultar a assistente.');
      return;
    }

    setLoading(true);
    setError('');
    setMeta('');

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: trimmedQuestion }),
      });

      const data: AskResponse = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Falha ao consultar a assistente (${res.status})`);
      }

      setAnswer(String(data.answer || ''));

      const parts: string[] = [];
      if (data.contextMode) parts.push(String(data.contextMode));
      if (typeof data.usedRows === 'number') parts.push(`${data.usedRows} camisas no contexto`);
      setMeta(parts.join(' • '));
    } catch (err: any) {
      setAnswer('');
      setMeta('');
      setError(err?.message || 'Nao foi possivel consultar a assistente agora.');
    } finally {
      setLoading(false);
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
            <div className={styles.heroText}>
              <span className={styles.eyebrow}>
                <span className={styles.eyebrowDot} aria-hidden="true" />
                Assistente IA
              </span>

              <h1>Perguntas sobre as camisas</h1>
            </div>
          </header>

          <div className={styles.grid}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>Fazer pergunta</h2>
                <p className={styles.panelDescription}>
                  Pergunte por nome, usuario, ID, rastreio ou status. Quanto mais especifica a pergunta,
                  melhor a resposta.
                </p>
              </div>

              <form className={styles.questionForm} onSubmit={handleSubmit}>
                <textarea
                  className={styles.questionField}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Exemplo: quais camisas estao pendentes para o usuario 3557?"
                />

                <div className={styles.actions}>
                  <button type="submit" className={styles.submitBtn} disabled={loading || !trimmedQuestion}>
                    {loading ? 'Consultando...' : 'Perguntar para a IA'}
                  </button>
                  <span className={styles.meta}>
                    {loading ? 'Buscando dados e montando a resposta...' : meta || 'A resposta aparecera abaixo.'}
                  </span>
                </div>
              </form>

              {error ? <div className={styles.error}>{error}</div> : null}

              <div className={styles.conversation}>
                {trimmedQuestion ? (
                  <article className={`${styles.message} ${styles.messageUser}`}>
                    <span className={styles.messageLabel}>Sua pergunta</span>
                    <p className={styles.messageBody}>{trimmedQuestion}</p>
                  </article>
                ) : null}

                {answer ? (
                  <article className={`${styles.message} ${styles.messageAssistant}`}>
                    <span className={styles.messageLabel}>Resposta da assistente</span>
                    <p className={styles.messageBody}>{answer}</p>
                  </article>
                ) : (
                  <div className={styles.emptyState}>
                    A assistente ainda nao respondeu nada nesta sessao. Envie uma pergunta para comecar.
                  </div>
                )}
              </div>
            </div>

            <aside className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>Sugestoes</h2>
                <p className={styles.panelDescription}>
                  Estes exemplos ajudam a testar a integracao sem precisar montar o prompt do zero.
                </p>
              </div>

              <div className={styles.tips}>
                {EXAMPLE_QUESTIONS.map((item) => (
                  <div key={item} className={styles.tipCard}>
                    <h3 className={styles.tipTitle}>Exemplo de pergunta</h3>
                    <p className={styles.tipText}>
                      <code>{item}</code>
                    </p>
                  </div>
                ))}

                <div className={styles.tipCard}>
                  <h3 className={styles.tipTitle}>Como a resposta e gerada</h3>
                  <p className={styles.tipText}>
                    A rota consulta as camisas no banco, monta um contexto resumido e envia a pergunta para o
                    Gemini responder somente com base nesses dados.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
