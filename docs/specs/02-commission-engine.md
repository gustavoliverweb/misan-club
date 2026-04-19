2.1. Objetivo
Implementar la lógica matemática para la distribución de beneficios por venta.

2.2. Fórmula de CálculoPara cada venta realizada por un User_A, el sistema debe identificar a sus 5 patrocinadores ascendentes ($S_1, S_2, S_3, S_4, S_5$).
La comisión para el nivel $n$ se calcula como:$$C_n = (Base\_Calculo \times Margin\_Factor) \times P_n$$

Donde:
$Base\_Calculo$: Precio de socio sin impuestos (Neto).
$Margin\_Factor$: Coeficiente según la categoría del producto (ej. Nutrición = 0.8, Servicios = 0.4).
$P_n$: Porcentaje asignado al nivel $n$ (ej. Nivel 1: 10%, Nivel 2: 5%, etc.).

2.3. Reglas de Ejecución
Trigger: El motor se dispara solo cuando el estado del pedido es PAID.

Atomicidad: El cálculo y la inserción en el Wallet deben ocurrir dentro de una Transacción SQL. Si el cálculo falla, el saldo no se toca.

Compresión de Niveles: Si un nivel ascendente no tiene membresía activa, su comisión debe ir a un "Fondo de Reserva" de la empresa (no se pierde, pero no se paga al socio inactivo).
