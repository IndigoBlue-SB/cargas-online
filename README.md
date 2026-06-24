# Cargas Online

Esta es la version online compartida de Cargas.

## Como funciona

- El administrador crea eventos, usuarios y permisos.
- Los usuarios entran con el mismo link desde distintas computadoras.
- Todos leen y escriben sobre la misma base de datos del servidor.

## Variables recomendadas

- `PORT`: lo define el hosting automaticamente.
- `DATA_DIR`: carpeta persistente para guardar la base, por ejemplo `/data`.

## Importante

Para produccion conviene usar un hosting con disco persistente o volumen. Si el hosting no tiene disco persistente, los datos pueden perderse al reiniciar.
