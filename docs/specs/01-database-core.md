1.1. Objetivo
Definir la estructura de persistencia en PostgreSQL utilizando Drizzle ORM, centrada en la integridad referencial para una red de mercadeo multinivel de 5 niveles.

1.2. Esquema de Tablas
users: id (uuid), email, full_name, kyc_status (enum: pending, verified, rejected), role (enum: admin, leader, member).

network_hierarchy:

member_id (uuid, FK users.id)

sponsor_id (uuid, FK users.id) -> Quién lo invitó.

depth (int) -> Nivel absoluto en la red global.

memberships: id, user_id, status (active, expired), expires_at (timestamp), auto_renew (boolean).

1.3. Restricciones de Integridad
No Circularidad: Un usuario no puede ser su propio sponsor ni un descendiente puede ser sponsor de su ancestro.

Límite de Profundidad en Consultas: Las funciones de búsqueda de "Upline" deben limitarse estrictamente a 5 niveles ascendentes.

1.4. Seguridad
RLS (Row Level Security): Un socio solo puede ver los datos básicos (nombre, nivel) de su "Downline" (personas debajo de él), nunca sus datos de facturación o documentos KYC.
