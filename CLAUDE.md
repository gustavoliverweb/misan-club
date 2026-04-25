@AGENTS.md

# Reglas del Proyecto

## Estándares de UI

- Usar `BentoGrid` y `BentoGridItem` de Aceternity UI para el dashboard principal.
- Implementar bordes con gradientes sutiles o efectos de "Glow" solo en elementos activos.
- Los componentes deben ser responsivos y usar el patrón de diseño "Mobile First".

## Restricciones de Hover

- Antes de añadir un estado `:hover`, verifica si el elemento es un enlace. Si no lo es, mantén el estado visual estático.
