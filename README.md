# LIGHTMAN · Jockey Plaza · Torres de luz

[Abrir el visualizador](https://lightmanshows.github.io/torres-joker-plaza/)

Dos estructuras de 6 m con delineado neón pixel RGB, control cada 5 cm y acabado luminoso continuo. La geometría interpreta la fotografía de referencia del usuario; la altura y el paso son los requisitos confirmados. Los diámetros, aros, separación y metrajes son estimaciones conceptuales.

Tres composiciones instrumentales originales y 12 escenas por pista:

| Show | Estilo | BPM | Duración |
| --- | --- | --- | --- |
| Encuentro dorado | Lounge cálido | 100 | 1:55,2 |
| Pulso de la plaza | House festivo | 120 | 1:36 |
| Aurora nocturna | Electrónica cinematográfica | 108 | 1:46,67 |

El audio es el reloj del visor. Reproducir, pausar, avanzar, cambiar de canción, repetir y saltar a escenas conservan la sincronización. Tres cámaras, arrastre, zoom, brillo, noche/hora azul y pantalla completa. En móvil, el visor se apila debajo de la presentación.

La luz usa mallas de tubo con colores interpolados y difusión de pantalla; no hay sprites ni puntos LED. La representación es continua incluso durante los barridos.

## Abrir localmente

Desde esta carpeta, ejecuta `python -m http.server 8173` y abre `http://localhost:8173`. No necesita compilación. Three.js se incluye localmente; las fuentes tienen alternativas locales.

## Archivos

- `assets/audio/`: MP3 y WAV estéreo de cada show.
- `assets/sequences/`: tres FSEQ v2 comprimidos con zlib, RGB, 40 fps y brillo 50 %.
- `geometry.json`: segmentos y coordenadas conceptuales.
- `segments.csv`: orden lineal RGB por segmento, sin inventar asignaciones de hardware.
- `tracks.json`: escenas, tiempos, duración y referencia de audio.
- `proyecto.html`: propuesta imprimible.
- `sources/generate_music.py`: síntesis reproducible. Requiere Python, numpy y FFmpeg.
- `sources/export-fseq.cjs`: exportador compartido con el visor. Requiere Node.js; ejecutar `node sources/export-fseq.cjs all .5`.

El modelo estima 237,65 m de neón y 4.760 píxeles, 14.280 canales RGB, para ambas torres. Cada tramo redondea su cantidad de píxeles al paso nominal. Las costillas recorren base → corona; los aros se ordenan de abajo hacia arriba. Primero torre 1 (izquierda en frontal), después torre 2. Se requieren medidas reales para cerrar los metrajes, cantidades y correspondencia con el cableado.

El navegador simula y no transmite Art-Net. Las secuencias exportadas corresponden al modelo conceptual; la asignación real de canales, controladores, tensión, potencia e inyección se define con el hardware elegido. No se altera un patch físico existente.

Música creada por síntesis desde cero, sin grabaciones, voces ni samples de terceros. Logo y fotografía del usuario. Three.js MIT, ver `LICENSES.txt`.
