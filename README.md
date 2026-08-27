# Cargas Online

Esta es la version online compartida de Cargas.

## Como funciona

- El administrador crea eventos, usuarios y permisos.
- Los usuarios entran con el mismo link desde distintas computadoras.
- Todos leen y escriben sobre la misma base de datos del servidor.

## Variables recomendadas

- `PORT`: lo define el hosting automaticamente.
- `DATA_DIR`: carpeta persistente para guardar la base, por ejemplo `/data`. Si no se define, en Railway la app usa automaticamente `RAILWAY_VOLUME_MOUNT_PATH`.

## Importante

Para produccion hay que conectar un volumen persistente al servicio de Railway. Si no hay volumen, los eventos, cargas, balances y estadisticas pueden perderse al reiniciar o desplegar.

En Railway:

1. Abrir el servicio de Cargas Online.
2. Agregar un Volume.
3. Montarlo en una ruta persistente, por ejemplo `/data`.
4. Desplegar nuevamente.

La app guarda la base en `db.json` dentro de ese volumen y antes de cada escritura deja una copia `db.json.bak`.
