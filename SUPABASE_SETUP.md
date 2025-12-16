# Instrucciones para Crear la Tabla en Supabase

## Método Manual (Recomendado)

Dado que la API de gestión de Supabase está presentando problemas, sigue estos pasos para crear la tabla manualmente:

### Pasos:

1. **Abre el Dashboard de Supabase**
   - Ve a: https://supabase.com/dashboard
   - Inicia sesión con tu cuenta

2. **Selecciona tu Proyecto**
   - Busca y selecciona el proyecto correspondiente a tu chatbot

3. **Abre el SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"
   - Haz clic en "New Query"

4. **Copia y Pega el SQL**
   - Abre el archivo `supabase_requests.sql` en tu editor
   - Copia TODO el contenido
   - Pégalo en el editor SQL de Supabase

5. **Ejecuta la Query**
   - Haz clic en el botón "Run" o presiona `Ctrl+Enter`
   - Deberías ver un mensaje de éxito

6. **Verifica la Creación**
   - Ve a "Table Editor" en el menú lateral
   - Deberías ver la nueva tabla `service_requests`

## Contenido del SQL

El archivo `supabase_requests.sql` contiene:
- Creación de tipos ENUM (`service_type`, `request_status`)
- Creación de la tabla `service_requests`
- Configuración de Row Level Security (RLS)
- Políticas de acceso para usuarios anónimos y autenticados

## Verificación

Una vez creada la tabla, puedes verificar que funciona correctamente probando el chatbot y confirmando una solicitud de servicio.
