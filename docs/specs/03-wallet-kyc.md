3.1. Objetivo
Gestionar el dinero de forma inmutable y verificar la identidad legal del socio.

3.2. El Ledger (Libro Mayor)
Prohibido usar una columna balance en la tabla users como única fuente de verdad. Se debe usar una tabla transactions:
id, user_id, amount (decimal), type (credit, debit), description, reference_id (order_id o withdrawal_id).
Saldo Actual: Se calcula mediante la suma de créditos y débitos: $\sum (credits) - \sum (debits)$.

3.3. Restricciones de Retirada
KYC Required: El botón de "Retirar" está bloqueado si user.kyc_status != 'verified'.
Umbral Mínimo: Solo se permiten retiros si $Saldo \ge 50.00\text{ EUR}$.
Ventana Temporal: Las solicitudes solo se procesan del día 1 al 5 de cada mes.

3.4. Seguridad
Checksum: Cada entrada en el Ledger debe tener un hash de integridad que vincule con la entrada anterior para detectar manipulaciones en la base de datos.
