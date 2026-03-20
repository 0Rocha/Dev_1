import Link from 'next/link';
import { pool } from '@/lib/db';
import styles from './logs.module.css';

type LogItem = {
  id: number;
  camisa_id: number;
  acao: string;
  usuario_nome?: string | null;
  alterado_em: string;
  antes?: Record<string, any> | null;
  depois?: Record<string, any> | null;
};

const fieldLabels: Record<string, string> = {
  rastreio: 'Rastreio',
  usuario: 'Usuário',
  nome: 'Nome',
  cpf: 'CPF',
  telefone: 'Telefone',
  tamanho: 'Tamanho',
  endereco: 'Endereço',
  status: 'Status',
};

async function getLogs(id: string): Promise<LogItem[]> {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        camisa_id,
        acao,
        usuario_nome,
        alterado_em,
        antes,
        depois
      FROM camisas_log
      WHERE camisa_id = $1
      ORDER BY alterado_em DESC
      `,
      [id]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    return [];
  }
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return date;
  }
}

function normalizeValue(value: any) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function getChangedFields(
  antes?: Record<string, any> | null,
  depois?: Record<string, any> | null
) {
  const keys = Object.keys(fieldLabels);

  return keys
    .map((key) => {
      const oldValue = normalizeValue(antes?.[key]);
      const newValue = normalizeValue(depois?.[key]);

      if (oldValue === newValue) return null;

      return {
        key,
        label: fieldLabels[key],
        oldValue,
        newValue,
      };
    })
    .filter(Boolean) as Array<{
    key: string;
    label: string;
    oldValue: string;
    newValue: string;
  }>;
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const logs = await getLogs(id);

  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <div className={styles.topBar}>
          <div>
            <p className={styles.breadcrumb}>Camisas / Logs</p>
            <h1 className={styles.title}>Histórico da camisa #{id}</h1>
          </div>

          <Link href="/camisas" className={styles.backBtn}>
            Voltar
          </Link>
        </div>

        {logs.length === 0 ? (
          <div className={styles.emptyState}>Nenhum log encontrado.</div>
        ) : (
          <div className={styles.timeline}>
            {logs.map((log) => {
              const changedFields = getChangedFields(log.antes, log.depois);

              return (
                <article key={log.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>
                        {log.acao === 'UPDATE' ? 'Camisa atualizada' : log.acao}
                      </h2>
                      <p className={styles.cardMeta}>
                        Alterado por <strong>{log.usuario_nome || 'desconhecido'}</strong>
                      </p>
                      <p className={styles.cardMeta}>{formatDate(log.alterado_em)}</p>
                    </div>
                  </div>

                  {changedFields.length === 0 ? (
                    <div className={styles.emptyChanges}>
                      Nenhuma diferença identificada entre antes e depois.
                    </div>
                  ) : (
                    <div className={styles.changesList}>
                      {changedFields.map((field) => (
                        <div key={field.key} className={styles.changeItem}>
                          <div className={styles.changeLabel}>{field.label}</div>

                          <div className={styles.changeValues}>
                            <div className={styles.changeBoxOld}>
                              <span className={styles.changeTagOld}>Antes</span>
                              <p>{field.oldValue}</p>
                            </div>

                            <div className={styles.changeArrow}>→</div>

                            <div className={styles.changeBoxNew}>
                              <span className={styles.changeTagNew}>Depois</span>
                              <p>{field.newValue}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
