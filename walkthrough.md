# Reporte de Cambios: Refactorización y Seguridad

Este documento detalla las mejoras realizadas en el proyecto bajo la dirección del Programador Senior.

## Fase 1: Core y Seguridad

### 1. Refactorización del Hook `useChat`
El hook principal `useChat.ts` era un "monolito" que mezclaba lógica de estado, red y procesamiento de texto.
- **Acción**: Se extrajo la lógica de parseo a `src/lib/chatUtils.ts`.
- **Resultado**: Código más limpio y fácil de mantener.

### 2. Unificación de Seguridad (Admin)
Se detectó una inconsistencia grave entre la verificación de admins en Frontend vs Backend.
- **Acción**: Se actualizó la función `is_admin()` en la DB para usar la tabla `profiles` como única fuente de verdad.
- **Resultado**: Seguridad robusta y consistente.

## Fase 2: Componentes (Frontend)

Se identificaron componentes "monolíticos" que dificultaban la mantenibilidad. Se procedió a dividirlos en sub-componentes funcionales.

### 1. `HomePanel.tsx`
Este componente manejaba demasiada responsabilidad UI. Se dividió en:
- `src/components/home/WelcomeHeader.tsx`: Cabecera y saludo.
- `src/components/home/DebtAlert.tsx`: Alerta de pagos pendientes.
- `src/components/home/ServicesGrid.tsx`: Botones de selección de servicio.
- `src/components/home/ChatbotBanner.tsx`: Acceso al bot.
- `src/components/home/RecentActivity.tsx`: Lista de solicitudes.

### 2. `Login.tsx`
El formulario de login contenía mucha lógica visual inline. Se organizó en:
- `src/components/auth/LoginHeader.tsx`: Logo y títulos.
- `src/components/auth/LoginForm.tsx`: Formulario de email/password.
- `src/components/auth/GoogleLoginBtn.tsx`: Botón de OAuth.

### Verificación
- Se ejecutó `eslint` para asegurar que la reestructuración no introdujo errores de sintaxis.

## Fase 3: Auditoría y Correcciones UI (Login & Landing)

### 1. Login UI Break Fix
- **Problema**: Usuarios reportaron que "no funcionaba el scroll ni los botones" en Login.
- **Causa**: Capas visuales de fondo ("ambient background") estaban sobreponiéndose al contenido interactivo, bloqueando los clicks. Además, faltaba `overflow-y-auto`.
- **Solución**: Se agregó `pointer-events-none` a los fondos y se habilitó el scroll en el contenedor principal.

### 2.Landing Page
- **Ajuste**: Se movió el Footer dentro del flujo de scroll y se redujo su tamaño para mejorar la UX en móviles.

### 3. Auditoría de Seguridad (RLS)
- **Hallazgo**: Políticas de seguridad inconsistentes. Algunas tablas (`landing_leads`, `gallery`) usaban email hardcodeado (`dedoctor...`) mientras otras usaban `is_admin()`.
- **Corrección**: Se aplicó una migración masiva para estandarizar TODAS las tablas al uso de `is_admin()`.
