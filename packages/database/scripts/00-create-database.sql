\set ON_ERROR_STOP on

-- Run this file while connected to the PostgreSQL maintenance database:
--   psql -U postgres -d postgres -f scripts/00-create-database.sql
--
-- Override the default database name when needed:
--   psql -U postgres -d postgres -v db_name=my_cms -f scripts/00-create-database.sql

\if :{?db_name}
\else
\set db_name iorderCMS
\endif

SELECT format(
  'CREATE DATABASE %I WITH OWNER %I ENCODING %L TEMPLATE template0',
  :'db_name',
  current_user,
  'UTF8'
)
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_database
  WHERE datname = :'db_name'
) \gexec

\echo Database :db_name is ready.
\echo Next: set DATABASE_URL, run db:migrate, then run db:seed.
