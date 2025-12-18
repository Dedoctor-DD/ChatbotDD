---
description: Guía para la integración y gestión de archivos en Supabase Storage
---

# Gestión de Archivos (Storage)

Este documento describe la arquitectura y el flujo de trabajo para manejar adjuntos (fotos, documentos) en el sistema.

## 1. Arquitectura de Datos

### Supabase Storage
- **Bucket**: `request_attachments`
- **Nivel de acceso**: Público para lectura (`SELECT`), Protegido para escritura (`INSERT` basado en `auth.uid()`).

### Tablas en Database
- **`request_attachments`**:
  - `id`: UUID (Primary Key)
  - `request_id`: UUID (Foreign Key a `service_requests.id`, opcional)
  - `user_id`: UUID (Owner del archivo)
  - `file_path`: String (Ruta en el bucket, ej: `userId/filename.jpg`)
  - `file_name`: String (Nombre original)
  - `file_type`: String (MIME type)
  - `file_size`: Number (Bytes)
  - `created_at`: Timestamptz

## 2. Flujo de Carga (Frontend)

1. **Upload**: El usuario selecciona un archivo. Se llama a `uploadAttachment(file, userId, requestId)`.
2. **Registro**: La función sube el archivo al bucket y CREA una entrada en la tabla `request_attachments`.
3. **Persistencia**: Si el `requestId` es nulo (se subió antes de confirmar), el ID del adjunto debe guardarse temporalmente en el estado de la aplicación.
4. **Vinculación**: Al confirmar la solicitud de servicio, se debe ejecutar un `UPDATE` en `request_attachments` para asignar el `request_id` generado.

## 3. Visualización (Admin)

1. El Admin recupera las solicitudes de servicio.
2. Por cada solicitud, realiza una consulta a `request_attachments` filtrando por `request_id`.
3. Se generan URLs públicas (o firmadas si el bucket fuera privado) para mostrar las previsualizaciones.

## 4. Mejores Prácticas
- **Validación**: Limitar archivos a 10MB.
- **Seguridad**: Usar RLS para asegurar que un usuario solo pueda subir archivos a su propia carpeta (`userId/`).
- **Limpieza**: (Opcional) Implementar un trigger o Edge Function para borrar archivos físicos si se elimina la fila en la DB.
