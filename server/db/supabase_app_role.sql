-- Create a least-privilege application user for CCTNS (defaults)
-- Defaults: schema=public, user=cctns_app, pooled connections via 6543

-- 1) Create or update role and set search_path
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'cctns_app') then
    create role cctns_app login password '<STRONG_PASSWORD>'; -- replace
  else
    alter role cctns_app password '<STRONG_PASSWORD>';
  end if;
end
$$;

alter role cctns_app set search_path = public, public;

-- 2) Grants on existing objects in public
grant usage on schema public to cctns_app;
grant select, insert, update, delete on all tables in schema public to cctns_app;
grant usage, select on all sequences in schema public to cctns_app;

-- 3) Grants on future objects in public
alter default privileges in schema public
  grant select, insert, update, delete on tables to cctns_app;
alter default privileges in schema public
  grant usage, select on sequences to cctns_app;

-- 4) Print helper connection strings (swap HOST with your project host)
select
  format('postgresql://cctns_app:%s@%s:6543/%s?sslmode=require', '<STRONG_PASSWORD>', '<HOST>', current_database()) as database_url_pooled,
  format('postgresql://cctns_app:%s@%s:5432/%s?sslmode=require', '<STRONG_PASSWORD>', '<HOST>', current_database()) as database_url_direct;


