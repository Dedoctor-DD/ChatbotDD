# DD Chatbot

Chatbot inteligente desarrollado con React, TypeScript, Supabase y Google Gemini AI.

## 🚀 Características

- ✅ Autenticación con Google OAuth
- ✅ Chat interactivo con IA usando Gemini 2.0 Flash
- ✅ Reconocimiento de voz (Web Speech API)
- ✅ Gestión de solicitudes de servicios (transporte y taller)
- ✅ Historial de conversaciones persistente
- ✅ Interfaz moderna y responsive

## 🛠️ Tecnologías

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **IA**: Google Gemini 2.0 Flash
- **Autenticación**: Supabase Auth con Google OAuth

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase
- Cuenta de Google Cloud (para OAuth y Gemini API)

## 🔧 Configuración

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd CHATBOT
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_clave_publica_de_supabase
```

### 4. Configurar Supabase

#### Crear tablas en Supabase

Ejecuta el script SQL `supabase/create_all_tables.sql` en el SQL Editor de Supabase Dashboard.

O usa el script de Node.js:

```bash
npm run check-tables
```

#### Configurar Edge Function

1. Ve a Supabase Dashboard → Edge Functions
2. Crea/actualiza la función `chat`
3. Agrega el secret `GEMINI_API_KEY` con tu API key de Gemini

#### Configurar Autenticación Google

1. Ve a Authentication → Providers → Google
2. Habilita Google provider
3. Configura Client ID y Client Secret de Google Cloud Console

### 5. Obtener API Key de Gemini

1. Ve a https://aistudio.google.com/apikey
2. Crea una nueva API Key
3. Agrega la key como secret en Supabase Edge Functions

## 🚀 Ejecutar

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm run preview
```

## 📁 Estructura del Proyecto

```
├── src/
│   ├── components/       # Componentes React
│   │   ├── Login.tsx     # Pantalla de login
│   │   └── ConfirmationCard.tsx
│   ├── lib/              # Utilidades
│   │   ├── gemini.ts     # Cliente Gemini
│   │   └── supabase.ts   # Cliente Supabase
│   ├── App.tsx           # Componente principal
│   └── main.tsx          # Punto de entrada
├── supabase/
│   ├── functions/        # Edge Functions
│   │   └── chat/         # Función de chat
│   └── create_all_tables.sql  # Script SQL principal
├── scripts/              # Scripts de utilidad
│   ├── check-and-create-tables.js
│   ├── create-tables-step-by-step.js
│   └── verify-supabase.js
└── package.json
```

## 🗄️ Base de Datos

### Tablas

- **messages**: Historial de conversaciones
- **service_requests**: Solicitudes de servicios

Ver `supabase/create_all_tables.sql` para el esquema completo.

## 📚 Documentación Adicional

- `MCP_SETUP.md`: Configuración del MCP de Supabase
- `SUPABASE_SETUP.md`: Guía de configuración de Supabase

## 🔐 Seguridad

- Las API keys están protegidas en Edge Functions
- Row Level Security (RLS) habilitado en todas las tablas
- Autenticación requerida para usar el chatbot

## 📝 Scripts Disponibles

- `npm run dev`: Inicia servidor de desarrollo
- `npm run build`: Construye para producción
- `npm run preview`: Previsualiza build de producción
- `npm run lint`: Ejecuta ESLint
- `npm run check-tables`: Verifica tablas en Supabase

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado.

## 👤 Autor

DD Chatbot Team

---

**Desarrollado con ❤️ usando React, Supabase y Gemini AI**
