# Sistema Monitoreo Terminal CDE

Sistema web en tiempo real para gestión operativa de viajes en terminal y notificación automática al pasajero por WhatsApp.

## Funcionalidades
- Login administrativo simple
- Registro, edición y eliminación de viajes
- Panel público en tiempo real con Socket.IO
- KPIs operativos
- Historial de eventos
- Bitácora de notificaciones
- WhatsApp para recordatorio, atraso y cancelación
- Limpieza automática del panel
- Protección de datos personales en la API pública

## Requisitos
- Node.js 18 o superior
- npm

## Instalación
1. Copiar `.env.example` a `.env`
2. Instalar dependencias:
   - `npm install`
3. Ejecutar en desarrollo:
   - `npm run dev`
4. O ejecutar normal:
   - `npm start`

## Acceso
- Login admin: configurado por `.env`
- URL admin: `http://localhost:3000/login.html`
- URL display: `http://localhost:3000/display.html`

## WhatsApp
Por defecto está deshabilitado (`WHATSAPP_ENABLED=false`).

Cuando está deshabilitado:
- no envía mensajes reales
- registra envíos simulados en la bitácora

Para habilitarlo:
- configurar `WHATSAPP_ENABLED=true`
- completar `WHATSAPP_TOKEN`
- completar `WHATSAPP_PHONE_NUMBER_ID`

## Notas técnicas
- La API pública no devuelve `nombrePasajero` ni `telefonoUsuario`
- Los recordatorios usan `fechaViaje + horaProgramada`
- El atraso manual se soporta con `minutosAtrasoManual`
- Los errores de WhatsApp quedan registrados en `notifications.json`
