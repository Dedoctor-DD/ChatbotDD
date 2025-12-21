# Plan de Transformación: DeDoctor Professional 2.0

## 1. Análisis de Marca e Identidad
Basado en el logo "DeDoctor & MMC", hemos identificado una paleta de colores mucho más sólida, corporativa y profesional, alejándonos de los tonos pasteles suaves (estilo "infantil" o "suave") para pasar a una estética de **Alta Ingeniería y Salud Corporativa**.

### Nueva Paleta de Colores (Estilo "Dark Corporate Blue")
*   **Primario (Deep Navy)**: `#0f172a` (Slate 900) - Para encabezados, barras de navegación y textos principales. Transmite autoridad y seriedad.
*   **Acento (Electric Royal Blue)**: `#1e40af` (Blue 800) a `#2563eb` (Blue 600) - Para botones de acción (CTA), enlaces y elementos interactivos. Es el color de la "energía" y la "confianza médica".
*   **Fondo (Tech Grey)**: `#f8fafc` (Slate 50) y `#f1f5f9` (Slate 100) - Un gris muy sutil y frío, mucho más profesional que el "Sky Blue" anterior.
*   **Superficies (Crisp White)**: Blanco puro con sombras sutiles, pero con bordes definidos (`border-slate-200`) en lugar de sombras difusas.

## 2. Mejoras de Interacción (UX)
### Botones de Opciones (Quick Replies) Integrados
*   **Cambio**: Los botones de opciones ya no estarán "flotando" abajo.
*   **Nueva Ubicación**: Se renderizarán **dentro del flujo del chat**, inmediatamente debajo del mensaje del asistente que las solicita.
*   **Comportamiento**: Al hacer clic en una opción, esta se enviará como mensaje y los botones "desaparecerán" o se deshabilitarán para mantener el historial limpio pero activo.

## 3. Plan de Ejecución
1.  **Refactorizar `App.tsx`**:
    *   Modificar la estructura de `Message` para soportar `options` (opciones).
    *   Mover la lógica de renderizado de botones adentro de la burbuja del chat.
2.  **Aplicar Rebranding en `App.css` y Componentes**:
    *   Actualizar gradientes.
    *   Cambiar colores de burbujas de chat (Usuario: Azul Marino Profundo; Bot: Blanco/Gris Tecnológico).
    *   Refinar tipografías y bordes (más `rounded-lg` o `rounded-xl` precisos, menos "burbujas infladas").
