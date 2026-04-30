create table if not exists clientes (
  id         bigserial primary key,
  telefono   text unique not null,
  nombre     text,
  created_at timestamptz default now()
);

create table if not exists pedidos (
  id         bigserial primary key,
  cliente_id bigint references clientes(id),
  telefono   text,
  detalle    text,
  estado     text default 'pendiente',
  created_at timestamptz default now()
);

create table if not exists productos (
  id             bigserial primary key,
  nombre         text not null,
  linea          text not null,
  precio_5_50    numeric(8,2),
  precio_51_300  numeric(8,2),
  precio_301_600 numeric(8,2),
  precio_601_mas numeric(8,2),
  activo         boolean default true,
  orden          int default 0
);

insert into productos (nombre, linea, precio_5_50, precio_51_300, precio_301_600, precio_601_mas, orden) values
  ('Longaniza Económica', 'economica', 60, 58, 56, 54, 1),
  ('Longaniza Especial',  'especial',  72, 70, 68, 66, 2),
  ('Longaniza Gourmet',   'gourmet',   80, 78, 75, 70, 3)
on conflict do nothing;

create table if not exists config (
  clave text primary key,
  valor text
);

insert into config (clave, valor) values
  ('pedido_minimo', '5'),
  ('zona_entrega', 'Atizapán, Tlalnepantla, Naucalpan')
on conflict (clave) do nothing;
