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

# Rutas y contenido para el Sub menú misanshop/

5. Ruta /misanshop/bienestar-en-casa/
   Título: Bienestar en Casa con MisanClub
   Subtítulo: Convierte tu hogar en un espacio más saludable y ahorra mientras ganas dinero.
   Concepto Principal: El bienestar empieza en casa. Espacio diseñado para transformar el hogar en un refugio saludable, cómodo y armonioso mediante productos de alta calidad y funcionalidad.
   Categorías de Productos:
   Agua (7 productos): Sistemas de ósmosis y purificadores de agua.
   Bienestar (14 productos): Purificadores de aire, aromaterapia y dispositivos de ozono para higiene ambiental.
   Confort (5 productos): Colchones ergonómicos de última generación y artículos de descanso.
   Hogar (4 productos): Aspiradores potentes y silenciosos, y artículos de limpieza.
   Menaje de hogar (3 productos): Baterías de cocina y sartenes.
   Velas artesanales (2 productos): Complementos para el ambiente del hogar.
   Propuesta de Valor:
   Ahorro: Acceso a precios exclusivos para socios, por debajo del mercado.
   Salud: Productos seleccionados para regenerar el entorno físico y emocional.
   Oportunidad: Posibilidad de ganar dinero mediante recomendaciones y comisiones de red hasta en 3 niveles.
6. Ruta: /categoria-producto/complementos-nutricionales/
   Título: Complementos Nutricionales
   Subtítulo: "El apoyo perfecto para cuidar tu salud y potenciar tu bienestar cada día".
   Descripción: Selección de cápsulas, comprimidos y suplementos naturales formulados con ingredientes de alta calidad para reforzar el sistema inmunológico, mejorar el rendimiento físico o cubrir carencias nutricionales.
   Líneas Destacadas:
   Línea HERBORA: "Bienestar natural, día a día". Ingredientes de origen vegetal para el equilibrio integral del organismo.
   Línea PWD Nutrition: "Nutrición que impulsa tu bienestar". Fórmulas innovadoras respaldadas por la ciencia para el rendimiento y la dietética.
   Compromiso: Combinación de naturaleza y ciencia para ofrecer soluciones eficaces y seguras para una salud equilibrada.
   Nota Técnica para Claude: Los productos de Herbora y PWD aplican el plan de comisión reducido (50%).

7. Ruta: /misanshop/tu-biblioteca/
   Título: Tu Biblioteca
   Subtítulo: "El conocimiento también se pone en la cesta".
   Filosofía: En MisanClub apostamos por el crecimiento de mente, cuerpo y bolsillo. No se trata de tener muchos libros, sino los libros correctos que inspiren y transformen.
   Temáticas: Desarrollo personal, mentalidad emprendedora, nutrición, ventas, finanzas y hábitos.
   Catálogo Destacado (Precios Socio):
   Del sofá al éxito: 14,40 € (Impuestos incluidos). Un viaje directo para dejar de poner excusas y empezar a actuar.
   Renacer sin miedo: 12,40 € (Impuestos incluidos). Guía práctica para superar el estancamiento y construir una nueva versión de ti mismo.
   Beneficio: Precios especiales reservados exclusivamente para socios con envío directo a casa.

8. Ruta: /misanshop/el-oferton/
   Título: El Ofertón
   Subtítulo: El chollo de la semana… solo para socios.
   Dinámica: Espacio exclusivo que presenta cada lunes una oferta única y sorprendente, válida solo durante 7 días o hasta agotar existencias.
   Tipo de Ofertas: Productos de bienestar, tecnología, belleza, hogar o escapadas a precios que no se encuentran en ningún otro sitio.
   Propósito: Premiar a los socios que están atentos y se mueven rápido. Es una experiencia de sorpresa y valor comunitario.
   Testimonios de Impacto:
   Socios reportan ahorros de más de 200 € al mes.
   Sensación de "Pase VIP al ahorro" donde la suscripción se recupera rápidamente gracias a estos descuentos.

# Plan de Acción para el Dropdown

Componente de Navegación: Implementar un menú desplegable dentro del componente Header que agrupe estas cuatro rutas bajo el nombre "Misan Shop".
Lógica de Acceso: Las cuatro páginas deben verificar si el usuario tiene una membresía activa para mostrar los "Precios de Socio".
Visualización de Precios:
En Bienestar en Casa y Complementos, destacar el ahorro frente al precio público.
En El Ofertón, ocultar el precio final hasta que el usuario inicie sesión, usando un CTA como "Descúbrelo ahora".
Integración de Comisiones:
Aplicar la base de cálculo sobre el precio de socio sin impuestos.
Asegurar que la categoría Biblioteca aplique la reducción del 50% en las comisiones de red

# Especificaciones para el Panel de Control (Admin)

Para que el administrador pueda subir productos, el formulario de "Nuevo Producto" debe incluir los siguientes campos obligatorios según las reglas de negocio de las fuentes:

Datos Básicos: Título, Descripción, Categoría y Fotos.
Configuración de Precios (Doble Precio):
Precio Público: El que pagan los clientes externos.
Precio Socio: El precio exclusivo para miembros activos.
Nota: El sistema debe calcular automáticamente el Margen Directo (P. Público - P. Socio).
Configuración de Comisiones (Motor de Red):
Base de Cálculo: Precio de socio sin impuestos.
Selector de Tipo de Comisión:
Estándar: Aplica 5% (Nivel 1), 3% (Nivel 2), 2% (Nivel 3), 1% (Nivel 4), 1% (Nivel 5).
Reducido (50%): Para marcas como Herbora, PWD, Rincón Herbal y Libros (reparte la mitad de los porcentajes estándar).
Especial: Permite introducir porcentajes manuales por nivel.
Configuración de Pool:
Checkbox para decidir si el producto Participa en la Pool.
El porcentaje destinado a la pool debe ser, por defecto, igual al del Nivel 1.
Facturación: Opción para activar la Generación de Autofactura automática tras la compra
