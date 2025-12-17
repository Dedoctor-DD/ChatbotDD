# 🧪 Guía de Pruebas Local (Control de Calidad)

Sigue estos pasos para validar las nuevas funcionalidades del Chatbot DD.

## 1. Inicio de Sesión "Invitado"
1.  Abre la aplicación en tu navegador (normalmente `http://localhost:5173`).
2.  En la pantalla de Login, busca el botón **"👻 Modo Invitado (Local)"**.
3.  Al hacer clic, deberías entrar automáticamente al Panel Principal sin necesidad de Google.

## 2. Prueba de Transporte (Compleja)
1.  Ve a la pestaña **Chat**.
2.  Escribe o dicta: *"Necesito un traslado para mañana a las 8am desde Las Condes hasta el Hospital del Trabajador, ida y vuelta con mi silla eléctrica."*
3.  **Verificación:**
    *   El bot debería detectar: Origen, Destino, Fecha, Hora, Ida y Vuelta.
    *   El bot debería preguntar *solo* lo que falta (ej: "¿A qué hora pasamos por ti para el regreso?").
4.  Responde con la hora de regreso.
5.  Confirma la solicitud con el botón "Sí, confirmar".

## 3. Prueba de Ubicación
1.  En el chat, haz clic en el botón de **"✨ / 📍"** (al lado del micrófono).
2.  Acepta el permiso de ubicación del navegador.
3.  **Verificación:** Debería aparecer un mensaje con tu enlace de Google Maps.

## 4. Prueba de Mantenimiento
1.  Vuelve al **Inicio** (Icono de Casa).
2.  Pulsa el botón **"Mantenimiento"** (Llave inglesa).
3.  Di: *"Mi silla hace un ruido extraño en la rueda derecha".*
4.  Sigue el flujo hasta confirmar.

## 5. Panel de Admin (Vista de Celular)
1.  Usa la pestaña **Admin** (si tienes permisos o simúlalos).
2.  Verifica que las tarjetas se vean bien en tamaño móvil (borde redondeado, sombras).
3.  Prueba los filtros de "Pendientes", "Transporte", etc.

---
**Nota:** Si el micrófono se corta, recuerda que ahora está configurado para **no enviar** automáticamente. Debes pulsar "Enviar" manualmente.
