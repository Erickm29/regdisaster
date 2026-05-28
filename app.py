"""
API web para clasificación de residuos por imagen.
Uso: desde la raíz del proyecto ejecutar:
  python -m web.app
  o: uvicorn web.app:app --reload --host 0.0.0.0 --port 8000
"""
import sys
from pathlib import Path

# Asegurar que se encuentra el módulo waste_classifier
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

import io
import base64
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel

app = FastAPI(title="Clasificador de residuos", version="1.0")

# Montar archivos estáticos (HTML, CSS, JS)
STATIC_DIR = Path(__file__).resolve().parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


class ResiduoResult(BaseModel):
    origen: str
    degradabilidad: str
    material: str
    reciclable: str
    confianza: float
    etiqueta_ocr: Optional[str] = None
    bbox: Optional[List[float]] = None


class ClasificacionResponse(BaseModel):
    residuos: List[ResiduoResult]
    uso_cloud_vision: bool
    error: Optional[str] = None


def run_classifier(image_bytes: bytes) -> ClasificacionResponse:
    """Ejecuta el pipeline sobre la imagen."""
    try:
        from waste_classifier import clasificar_imagen
        import numpy as np
        from PIL import Image

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        arr = np.array(img)
        resultado = clasificar_imagen(arr, use_detector=False)
        return ClasificacionResponse(
            residuos=[
                ResiduoResult(
                    origen=r.origen.value,
                    degradabilidad=r.degradabilidad.value,
                    material=r.material.value,
                    reciclable=r.reciclable.value,
                    confianza=round(r.confianza, 4),
                    etiqueta_ocr=r.etiqueta_ocr,
                    bbox=[r.bbox.x_min, r.bbox.y_min, r.bbox.x_max, r.bbox.y_max],
                )
                for r in resultado.residuos
            ],
            uso_cloud_vision=resultado.uso_cloud_vision,
        )
    except FileNotFoundError as e:
        return ClasificacionResponse(
            residuos=[],
            uso_cloud_vision=False,
            error="Modelo TFLite no encontrado. Entrena y exporta el modelo (ver docs/ENTRENAMIENTO.md).",
        )
    except Exception as e:
        return ClasificacionResponse(
            residuos=[],
            uso_cloud_vision=False,
            error=str(e),
        )


@app.get("/", response_class=HTMLResponse)
def index():
    """Sirve la página principal."""
    html_path = STATIC_DIR / "index.html"
    if html_path.exists():
        return FileResponse(html_path)
    return HTMLResponse(
        "<h1>Clasificador de residuos</h1><p>Sube una imagen en <a href='/static/index.html'>/static/index.html</a></p>"
    )


@app.post("/api/classify", response_model=ClasificacionResponse)
async def classify(file: UploadFile = File(...)):
    """Recibe una imagen y devuelve la clasificación de residuos."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "El archivo debe ser una imagen (jpg, png, webp, etc.).")
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(400, "El archivo está vacío.")
    return run_classifier(contents)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
