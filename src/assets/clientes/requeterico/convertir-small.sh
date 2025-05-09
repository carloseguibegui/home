#!/bin/bash

# Recorre todos los archivos .webp en el directorio actual
for img in *.webp; do
  # Saltea si el archivo ya es una imagen "small"
  if [[ "$img" == *-small.webp ]]; then
    continue
  fi

  # Genera la versión small
  ffmpeg -n -i "$img" -vf scale=20:-1 "${img%.webp}-small.webp"
done