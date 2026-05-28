# Versión web del clasificador de residuos

Interfaz en el navegador para subir una imagen y ver la clasificación (origen, material, reciclabilidad, degradabilidad).

## Cómo ejecutar

Desde la **raíz del proyecto** (`cursor proy`), con el entorno virtual activado:

```powershell
pip install -r web\requirements-web.txt
python -m web.app
```

Luego abre en el navegador: **http://localhost:8000**

Para que la clasificación funcione, debe existir el modelo TFLite en `src\waste_classifier\models\waste_classifier.tflite` (entrenado y exportado según docs/ENTRENAMIENTO.md). Si no está, la web mostrará un mensaje indicándolo.

## Estructura

- `app.py` — API FastAPI: sirve la página y el endpoint `POST /api/classify` para subir imágenes.
- `static/index.html` — Página principal (subida de imagen y resultados).
- `static/style.css` — Estilos (tema oscuro).
- `static/app.js` — Lógica de subida, llamada a la API y visualización de resultados.

## API

- `GET /` — Página principal.
- `POST /api/classify` — Body: `multipart/form-data` con campo `file` (imagen). Respuesta JSON con `residuos`, `uso_cloud_vision` y opcionalmente `error`.
