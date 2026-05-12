# (Sección Tienda) Misan Shop

1. Ruta: /shop/
   Título: Misan Shop
   Descripción: Tu tienda, formación y comunidad en un solo lugar. Calidad, innovación y exclusividad para cada parte de tu vida.
   Categorías Principales (Grid de Acceso):
   Bienestar en casa: (35 productos).
   Complementos nutricionales: (54 productos).
   Cursos y formaciones: (24 productos).
   Elixsia Cosmetics: (20 productos).
   Membresías: (1 producto).
   Misan Editorial: (6 productos).
   Servicios Inteligencia Artificial: (3 productos).
2. Ruta: /categoria-producto/bienestar-en-casa/
   Título: Bienestar en Casa
   Subcategorías (Grid):
   Agua: (7 productos).
   Bienestar: (14 productos).
   Confort: (5 productos).
   Hogar: (4 productos).
   Menaje de hogar: (3 productos).
   Velas artesanales: (2 productos).
3. Ruta: /categoria-producto/bienestar-en-casa/agua/
   Título: Agua
   Subcategorías (Grid):
   Agua hidrogenada: (3 productos).
   Fuente agua: (1 producto).
   Osmosis: (1 producto).
   Soluciones limpieza: (2 productos).
4. Ruta: /categoria-producto/bienestar-en-casa/agua/agua-hidrogenada/
   Título: Agua Hidrogenada
   Listado de Productos:
   Botella Hidrogenadora Portátil NOK: 695,00 € (Impuestos incluidos).
   Jarra Hydrowater Nature Cyclone: 2.795,00 € (Impuestos incluidos).
   Ósmosis Detox H2 600G Flujo Directo + Hidrógeno: 3.495,00 € (Impuestos incluidos).
   Acciones por Producto: Leer más, Vista rápida, Consultar por WhatsApp

# Especificaciones para el Panel de Control (Admin)

Para que el administrador pueda subir productos, el formulario de "Nuevo Producto" debe incluir los siguientes campos obligatorios según las reglas de negocio de las fuentes:

5. Datos Básicos: Título, Descripción, Categoría y Fotos.
6. Configuración de Precios (Doble Precio):
   Precio Público: El que pagan los clientes externos.
   Precio Socio: El precio exclusivo para miembros activos.
   Nota: El sistema debe calcular automáticamente el Margen Directo (P. Público - P. Socio).
7. Configuración de Comisiones (Motor de Red):
   Base de Cálculo: Precio de socio sin impuestos.
   Selector de Tipo de Comisión:
   Estándar: Aplica 5% (Nivel 1), 3% (Nivel 2), 2% (Nivel 3), 1% (Nivel 4), 1% (Nivel 5).
   Reducido (50%): Para marcas como Herbora, PWD, Rincón Herbal y Libros (reparte la mitad de los porcentajes estándar).
   Especial: Permite introducir porcentajes manuales por nivel.
8. Configuración de Pool:
   Checkbox para decidir si el producto Participa en la Pool.
   El porcentaje destinado a la pool debe ser, por defecto, igual al del Nivel 1.
9. Facturación: Opción para activar la Generación de Autofactura automática tras la compra
