# Stack padrão — Next.js + PostgreSQL

Estrutura padrão para aplicações web com Docker Compose: aplicação Next.js e PostgreSQL, rede interna entre containers e integração à rede externa `web-proxy` (reverse proxy + Let's Encrypt).

**Versões:** Node 22.12.0 · PostgreSQL 18.1

## Pré-requisitos

- Docker e Docker Compose
- Rede externa `web-proxy` já criada no host (para expor o app via reverse proxy). Se não usar o proxy, comente ou remova a rede `web-proxy` e as variáveis de proxy no serviço `app` do `docker-compose.yml`.

## Uso rápido

1. **Variáveis de ambiente**

   Copie o template e preencha os valores:

   ```bash
   cp .env.example .env
   ```

   Edite `.env` e defina pelo menos:

   - `POSTGRES_PASSWORD` e `DATABASE_URL` (senha e URL do banco)
   - Se usar web-proxy: `VIRTUAL_HOST`, `VIRTUAL_PORT`, `LETSENCRYPT_HOST`

2. **Rede web-proxy (se usar proxy)**

   A rede `web-proxy` deve existir no host. Exemplo:

   ```bash
   docker network create web-proxy
   ```

3. **Subir os serviços**

   ```bash
   docker compose up -d
   ```

   A aplicação será construída e os containers (app + db) serão iniciados. O app aguarda o PostgreSQL ficar saudável antes de iniciar.

4. **Parar**

   ```bash
   docker compose down
   ```

   Os dados do PostgreSQL permanecem no volume `pgdata`. Para remover também o volume:

   ```bash
   docker compose down -v
   ```

## Estrutura

- `docker-compose.yml` — serviços `app` (Next.js) e `db` (PostgreSQL), redes `internal` e `web-proxy`
- `Dockerfile` — build multi-stage da aplicação Next.js (Node 22.12.0-alpine, output standalone)
- `.env.example` — template de variáveis (web-proxy, banco e app)
- `app/` — código da aplicação Next.js

## Variáveis de ambiente (resumo)

| Variável           | Serviço | Descrição                          |
|--------------------|---------|------------------------------------|
| `VIRTUAL_HOST`     | app     | Hostname para o reverse proxy      |
| `VIRTUAL_PORT`     | app     | Porta interna do app (ex.: 3000)   |
| `LETSENCRYPT_HOST` | app     | Hostname para certificado HTTPS    |
| `POSTGRES_USER`    | db      | Usuário do PostgreSQL              |
| `POSTGRES_PASSWORD`| db      | Senha do PostgreSQL                |
| `POSTGRES_DB`      | db      | Nome do banco                      |
| `DATABASE_URL`     | app     | URL de conexão (host: `db`)        |

## Desenvolvimento local (sem Docker)

Na pasta `app/`:

```bash
cd app
npm install
cp ../.env.example ../.env   # se ainda não tiver .env na raiz
npm run dev
```

Configure `DATABASE_URL` apontando para um PostgreSQL acessível (localhost ou outro container).
