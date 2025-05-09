# #!/bin/bash

# # Recorre todos los archivos .webp en el directorio actual
# for img in *.webp; do
#   # Saltea si el archivo ya es una imagen "small"
#   if [[ "$img" == *-small.webp ]]; then
#     continue
#   fi

#   # Genera la versión small
#   ffmpeg -n -i "$img" -vf scale=20:-1 "${img%.webp}-small.webp"
# done
#!/bin/bash

# Recorre todos los archivos .png y .jpg en el directorio actual
for img in *.png *.jpg; do
    # Verifica si el archivo existe (por si no hay coincidencias)
    [ -e "$img" ] || continue
    
    # Genera el nombre del archivo de salida
    output="${img%.*}.webp"
    
    # Salta la conversión si el archivo WebP ya existe
    if [ -f "$output" ]; then
        echo "Saltando $img (${output} ya existe)"
        continue
    fi
    
    # Convierte a WebP con calidad ajustable (ajusta el parámetro -q)
    ffmpeg -i "$img" -compression_level 6 -qscale:v 70 "$output" 2>/dev/null
    
    echo "Convertido: $img → $output"
done
