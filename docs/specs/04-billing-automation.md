4.1. Objetivo
Generación automática de documentos legales y renovación de licencias.

4.2. Autofacturación
Cada vez que se genera una comisión, el sistema debe crear un registro de "Autofactura":
Emisor: El Socio (Member).

Receptor: MisanClub.

Concepto: "Servicios de intermediación comercial".

Requisito: El sistema debe adjuntar el PDF generado a un bucket S3 con acceso prefirmado por 15 minutos.

4.3. Cron Jobs
Daily Check: Un proceso a las 00:00 UTC que revise las membresías que expiran en 48 horas y envíe una notificación push/email.
Auto-Renewal: Si el usuario tiene auto_renew: true y saldo suficiente en el Wallet, cobrar la licencia directamente del saldo.

Qué encuentra Qué hace
Membresía active con expiresAt ya pasado La marca como expired
Membresía active con expiresAt en las próximas 48h + autoRenew=true + saldo ≥ 30€ Debita wallet y extiende 30 días
Membresía active con expiresAt en las próximas 48h pero sin saldo o autoRenew=false La deja, expirará en el siguiente ciclo
