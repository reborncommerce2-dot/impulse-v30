# IMPULSO 1.0 · Guía de puesta en producción

## Estado de esta versión
- Supabase está configurado con la URL del proyecto y la clave publicable.
- `supabase/schema.sql` contiene las tablas y políticas RLS necesarias.
- Se corrigió la carga de datos para que una sesión de Supabase no sea sobrescrita por los datos locales del navegador.
- Si Supabase pide confirmar el correo al registrarse, hay que confirmarlo antes de iniciar sesión.

## Paso 2 · Probar registro e inicio de sesión
1. Publicá la carpeta completa en un hosting estático (Cloudflare Pages o Netlify por Direct Upload).
2. Abrí la URL pública.
3. En Impulso, en "Primera vez", completá nombre, correo electrónico y contraseña.
4. Si aparece "Revisá tu correo", abrí el correo de Supabase y confirmá la cuenta.
5. Volvé a Impulso e iniciá sesión con ese correo y contraseña.
6. Entrá en "Nube y sincronización" y pulsá "Sincronizar ahora".
7. Comprobá que aparezca "Sincronizado".

## Paso 3 · Comprobar que los datos quedan guardados
1. Con la sesión iniciada, creá un hábito o registro sencillo.
2. Esperá unos segundos o pulsá "Sincronizar ahora".
3. Cerrá sesión.
4. Volvé a iniciar sesión con la misma cuenta.
5. El registro debe seguir ahí.
6. Para una prueba de aislamiento, creá una segunda cuenta con otro correo en una ventana de incógnito y comprobá que no vea los datos de la primera.

## Configuración avanzada todavía pendiente
- VAPID para notificaciones push.
- Edge Function `ai-chat` y secret `OPENAI_API_KEY` para IA en la nube.
- Edge Function `push-dispatch` y secrets VAPID.
- pg_cron + pg_net + Vault para recordatorios automáticos.

Nunca pongas claves secretas (`sb_secret_`, API keys privadas o VAPID privada) dentro de `index.html` o `supabase-config.js`.
