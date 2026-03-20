BEGIN;

ALTER TABLE IF EXISTS pedidos RENAME TO camisas;
ALTER TABLE IF EXISTS pedidos_log RENAME TO camisas_log;

ALTER TABLE IF EXISTS camisas_log
  RENAME COLUMN pedido_id TO camisa_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relname = 'pedidos_id_seq'
  ) THEN
    EXECUTE 'ALTER SEQUENCE pedidos_id_seq RENAME TO camisas_id_seq';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'camisas'
      AND column_name = 'id'
      AND column_default LIKE 'nextval(%pedidos_id_seq%)'
  ) THEN
    EXECUTE $sql$
      ALTER TABLE camisas
      ALTER COLUMN id SET DEFAULT nextval('camisas_id_seq'::regclass)
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pedidos_pkey'
  ) THEN
    EXECUTE 'ALTER TABLE camisas RENAME CONSTRAINT pedidos_pkey TO camisas_pkey';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pedidos_log_pkey'
  ) THEN
    EXECUTE 'ALTER TABLE camisas_log RENAME CONSTRAINT pedidos_log_pkey TO camisas_log_pkey';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pedidos_log_pedido_id_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE camisas_log RENAME CONSTRAINT pedidos_log_pedido_id_fkey TO camisas_log_camisa_id_fkey';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'pedidos_log_pedido_id_idx'
  ) THEN
    EXECUTE 'ALTER INDEX pedidos_log_pedido_id_idx RENAME TO camisas_log_camisa_id_idx';
  END IF;
END $$;

COMMIT;
