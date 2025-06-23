-- Create evaluation_metrics table for agent evaluation events
create table if not exists evaluation_metrics (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  barcode text,
  product_name text,
  brand text,
  evaluation jsonb not null,
  result jsonb not null
);

-- Index for fast querying by barcode or brand
create index if not exists idx_evaluation_metrics_barcode on evaluation_metrics (barcode);
create index if not exists idx_evaluation_metrics_brand on evaluation_metrics (brand); 