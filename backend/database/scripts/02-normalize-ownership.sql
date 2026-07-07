\set ON_ERROR_STOP on

-- Run as a PostgreSQL superuser after migrating an existing database whose
-- objects were created before the dedicated CMS owner was configured.

\if :{?app_owner}
\else
\set app_owner admin_iorder
\endif

SELECT format('ALTER TABLE %I.%I OWNER TO %I', schemaname, tablename, :'app_owner')
FROM pg_tables
WHERE schemaname IN ('public', 'drizzle')
  AND tableowner <> :'app_owner'
ORDER BY schemaname, tablename
\gexec

SELECT format('ALTER SEQUENCE %I.%I OWNER TO %I', sequence_schema, sequence_name, :'app_owner')
FROM information_schema.sequences
WHERE sequence_schema IN ('public', 'drizzle')
\gexec

SELECT format('ALTER TYPE %I.%I OWNER TO %I', namespace.nspname, type.typname, :'app_owner')
FROM pg_type AS type
JOIN pg_namespace AS namespace ON namespace.oid = type.typnamespace
JOIN pg_roles AS owner_role ON owner_role.oid = type.typowner
WHERE namespace.nspname = 'public'
  AND type.typtype = 'e'
  AND owner_role.rolname <> :'app_owner'
\gexec

SELECT format('ALTER SCHEMA %I OWNER TO %I', schema_name, :'app_owner')
FROM information_schema.schemata
WHERE schema_name = 'drizzle'
  AND schema_owner <> :'app_owner'
\gexec

\echo CMS database ownership is normalized to :app_owner.

