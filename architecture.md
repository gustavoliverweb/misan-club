Architecture Design: MisanClub MVP

1. Stack Tecnológico
   Framework: Next.js 15 (App Router).

Lenguaje: TypeScript (Strict Mode).

ORM: Drizzle ORM.

Base de Datos: PostgreSQL.

Validación: Zod.

Estilos: Tailwind CSS + Shadcn/UI.

2. Estructura de Directorios (Hexagonal Light)
   ├── app/ # Next.js App Router (Rutas, Layouts, Server Components)
   ├── core/ # LÓGICA DE NEGOCIO (Independiente del framework)
   │ ├── domain/ # Entidades puras y definiciones de tipos
   │ ├── services/ # Lógica compleja (Cálculos de comisiones, validación KYC)
   │ └── use-cases/ # Orquestación de acciones de usuario
   ├── infra/ # IMPLEMENTACIÓN TÉCNICA (Llamadas a IO/DB)
   │ ├── db/ # Configuración de Drizzle, Schemas y Migraciones
   │ ├── auth/ # Configuración de Auth.js (NextAuth)
   │ └── storage/ # Gestión de archivos (S3, Cloudinary, etc.)
   ├── components/ # Componentes de UI (Shadcn/UI, Shared Components)
   ├── lib/ # Utilidades generales, validaciones Zod y helpers
   ├── docs/ # Documentación técnica y especificaciones
   │ └── specs/  
   ├── tests/ # Pruebas unitarias y de integración
   ├── public/ # Assets estáticos (imágenes, fuentes)
   ├── .env # Variables de entorno
   ├── drizzle.config.ts # Configuración del ORM
   ├── next.config.js # Configuración de Next.js
   └── package.json

3. Core Business Logic (Reglas Inquebrantables)
   A. Sistema Multinivel (MLM)
   Profundidad Máxima: 5 niveles ascendentes.

Compresión Dinámica: Solo los socios con membresía ACTIVE califican para recibir comisiones. Si un nivel está inactivo, la comisión sube al siguiente nivel calificado o se retiene en el fondo corporativo (según Spec 02).

Consultas: Uso obligatorio de Recursive CTEs para la recuperación del árbol.

B. Finanzas (Inmutabilidad)
Ledger System: El saldo del usuario NUNCA es una columna editable. Es el resultado de la agregación de la tabla transactions.

Transacciones Atómicas: Todo pago de comisión debe ejecutarse dentro de una transacción de DB (ACID). Si el cálculo de un nivel falla, se revierte toda la operación.

C. Seguridad y KYC
Zero-Access Storage: Los documentos KYC se almacenan en buckets privados. El acceso se realiza mediante Presigned URLs con expiración de 5 minutos.

Principio de Menor Privilegio: Los socios solo pueden ver el display_name y join_date de su red descendente. Datos sensibles (email, teléfono, ingresos) están ocultos.

4. Convenciones de Desarrollo (Spec-Driven)
   Spec First: Antes de crear cualquier endpoint, se deben validar las reglas en /docs/specs/.

Test Driven: El motor de comisiones (/src/core/services/commission.service.ts) debe tener cobertura de tests unitarios al 100%.

No Hallucination: Claude Code no debe instalar librerías externas para utilidades simples (ej. no usar moment.js si se puede usar date-fns o el objeto Date nativo).

5. Glosario de Entidades

Socio (Member): Usuario con licencia pagada.

Patrocinador (Sponsor): El nodo superior inmediato en la red.

Upline: La línea de 5 niveles hacia arriba.

Wallet: Entidad virtual que refleja el histórico de transacciones del usuario.
