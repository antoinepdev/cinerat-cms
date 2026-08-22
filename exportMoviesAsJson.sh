#!/bin/bash

URL="http://localhost:4000/movies/"

# Verificar que se haya pasado el argumento con la ruta de salida
if [ -z "$1" ]; then
  echo "Uso: $0 <ruta_del_archivo_de_salida>"
  echo "Ejemplo: $0 /home/usuario/movies.json"
  exit 1
fi

OUTPUT_FILE="$1"

# Crear el directorio del archivo de salida si no existe
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Verificar dependencias
if ! command -v curl &> /dev/null; then
  echo "Error: curl no está instalado." >&2
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "Error: jq no está instalado. Instálalo (por ejemplo: apt install jq)" >&2
  exit 1
fi

echo "Obteniendo películas de $URL ..."

data=$(curl -sS --fail "$URL") || {
  echo "Error al descargar $URL" >&2
  exit 1
}

printf '%s\n' "$data" | jq -s 'add' > "$OUTPUT_FILE"

count=$(jq length "$OUTPUT_FILE")
echo "Exportadas $count películas a $OUTPUT_FILE"