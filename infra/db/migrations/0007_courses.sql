CREATE TABLE IF NOT EXISTS "courses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "titulo" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL UNIQUE,
  "descripcion" text,
  "badge" varchar(255),
  "categoria" varchar(100) NOT NULL,
  "modalidad" varchar(255),
  "frecuencia" varchar(255),
  "duracion" varchar(255),
  "acceso" varchar(255) DEFAULT 'Solo socios activos',
  "contenido" text,
  "perfil_participante" text,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);
