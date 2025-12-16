# Configuración del MCP de Supabase

Esta guía te ayudará a configurar el servidor MCP (Model Context Protocol) de Supabase en Claude Desktop para poder interactuar con tu proyecto de Supabase directamente desde el asistente de IA.

## ¿Qué es el MCP de Supabase?

El MCP de Supabase es un servidor que permite a los asistentes de IA (como Claude) conectarse directamente con tu proyecto de Supabase para:
- Consultar y gestionar tablas de la base de datos
- Listar y desplegar Edge Functions
- Ejecutar SQL de forma segura
- Buscar en la documentación de Supabase
- Obtener logs y diagnósticos del proyecto

## Requisitos Previos

1. Tener una cuenta de Supabase activa
2. Tener Claude Desktop instalado
3. Conocer el **Project Reference ID** de tu proyecto

## Paso 1: Obtener el Project Reference ID

1. Ve al [Dashboard de Supabase](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto (el que estás usando para este chatbot)
4. Ve a **Settings** (Configuración) en el menú lateral
5. Haz clic en **General**
6. Busca el campo **Reference ID** o **Project ID**
7. Copia este ID (tiene un formato como: `abcdefghijklmnop`)

## Paso 2: Configurar Claude Desktop

### Ubicación del archivo de configuración

El archivo de configuración de Claude Desktop se encuentra en:

```
C:\Users\s_pk_\AppData\Roaming\Claude\claude_desktop_config.json
```

### Configuración Recomendada (Modo Seguro)

Abre el archivo `claude_desktop_config.json` y agrega la siguiente configuración:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?read_only=true&project_ref=TU_PROJECT_REF_AQUI"
    }
  }
}
```

**Importante**: Reemplaza `TU_PROJECT_REF_AQUI` con el Project Reference ID que copiaste en el Paso 1.

### Opciones de Configuración

#### Modo Solo Lectura (Recomendado)

El parámetro `read_only=true` es **altamente recomendado** porque:
- ✅ Previene modificaciones accidentales a la base de datos
- ✅ Solo permite consultas SELECT
- ✅ Deshabilita herramientas de escritura como `apply_migration`, `deploy_edge_function`, etc.

#### Project Scoping (Recomendado)

El parámetro `project_ref=<tu-id>` es **altamente recomendado** porque:
- ✅ Limita el acceso solo a este proyecto específico
- ✅ Previene acceso accidental a otros proyectos de tu cuenta
- ✅ Mejora la seguridad general

#### Configuración Avanzada (Opcional)

Si quieres más control sobre qué herramientas están disponibles, puedes usar el parámetro `features`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?read_only=true&project_ref=TU_PROJECT_REF&features=database,docs,functions"
    }
  }
}
```

**Grupos de features disponibles**:
- `account`: Gestión de proyectos y organizaciones
- `database`: Consultas SQL, tablas, migraciones
- `docs`: Búsqueda en documentación de Supabase
- `debugging`: Logs y diagnósticos
- `development`: URLs, API keys, generación de tipos TypeScript
- `functions`: Edge Functions
- `storage`: Gestión de almacenamiento
- `branching`: Ramas de desarrollo (requiere plan de pago)

### Configuración Completa (Sin Restricciones)

⚠️ **No recomendado para uso general**. Solo usa esta configuración si necesitas acceso completo:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=TU_PROJECT_REF"
    }
  }
}
```

## Paso 3: Reiniciar Claude Desktop

1. **Cierra completamente** Claude Desktop (asegúrate de que no esté en la bandeja del sistema)
2. Vuelve a abrir Claude Desktop
3. Deberías ver un prompt de autenticación de Supabase

## Paso 4: Autenticación OAuth

1. Cuando se abra el navegador, inicia sesión en Supabase
2. **Importante**: Selecciona la **organización correcta** que contiene tu proyecto
3. Autoriza el acceso a Claude Desktop
4. Vuelve a Claude Desktop

## Paso 5: Verificar la Conexión

Una vez configurado, puedes verificar que el MCP funciona correctamente preguntándome:

- "Lista las tablas de mi base de datos"
- "Muéstrame las Edge Functions disponibles"
- "¿Cuál es la URL de mi proyecto?"
- "Ejecuta un SELECT * FROM service_requests LIMIT 5"

## Troubleshooting

### El servidor MCP no aparece

- Verifica que el archivo `claude_desktop_config.json` esté correctamente formateado (JSON válido)
- Asegúrate de haber reiniciado Claude Desktop completamente
- Revisa que no haya errores de sintaxis en el JSON

### Error de autenticación

- Verifica que hayas seleccionado la organización correcta durante el login
- Intenta cerrar sesión en Supabase y volver a autenticarte
- Verifica que tu cuenta tenga permisos en el proyecto

### "Server not found"

- Verifica que el `project_ref` sea correcto
- Asegúrate de que la URL esté completa y correcta
- Verifica tu conexión a internet

### Herramientas no disponibles

- Si estás en modo `read_only=true`, las herramientas de escritura no estarán disponibles
- Verifica el parámetro `features` si lo estás usando
- Algunas herramientas requieren planes de pago (como branching)

## Seguridad

### Mejores Prácticas

1. ✅ **Usa modo read-only por defecto**: Solo quita esta restricción cuando realmente necesites hacer cambios
2. ✅ **Usa project scoping**: Limita el acceso a un solo proyecto
3. ✅ **No uses en producción**: Configura el MCP para proyectos de desarrollo, no producción
4. ✅ **Revisa cada acción**: Claude Desktop te pedirá confirmar cada herramienta antes de ejecutarla - siempre revisa los detalles
5. ✅ **Usa branching**: Si tienes un plan de pago, usa ramas de desarrollo para probar cambios

### Riesgos de Seguridad

⚠️ **Prompt Injection**: Los LLMs pueden ser engañados por instrucciones maliciosas en los datos. Siempre revisa las acciones antes de ejecutarlas.

⚠️ **Acceso a Datos Sensibles**: El MCP opera bajo tus permisos de desarrollador. No lo compartas con usuarios finales.

## Recursos Adicionales

- [Documentación oficial del MCP de Supabase](https://supabase.com/docs/guides/getting-started/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/introduction)
- [Dashboard de Supabase](https://supabase.com/dashboard)

## Ejemplo de Configuración Completa

Aquí está un ejemplo completo del archivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?read_only=true&project_ref=abcdefghijklmnop&features=database,docs,functions,debugging"
    }
  }
}
```

Reemplaza `abcdefghijklmnop` con tu Project Reference ID real.

---

**¿Necesitas ayuda?** Una vez configurado el MCP, puedo ayudarte a:
- Explorar tu base de datos
- Gestionar Edge Functions
- Ejecutar consultas SQL
- Buscar en la documentación de Supabase
- Diagnosticar problemas
