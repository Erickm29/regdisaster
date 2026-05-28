(function () {
  const choiceSection = document.getElementById('choiceSection');
  const useCameraBtn = document.getElementById('useCameraBtn');
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const cameraSection = document.getElementById('cameraSection');
  const cameraVideo = document.getElementById('cameraVideo');
  const captureCanvas = document.getElementById('captureCanvas');
  const captureBtn = document.getElementById('captureBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const switchToUploadBtn = document.getElementById('switchToUploadBtn');
  const previewSection = document.getElementById('previewSection');
  const previewImg = document.getElementById('previewImg');
  const clearBtn = document.getElementById('clearBtn');
  const classifyBtn = document.getElementById('classifyBtn');
  const loadingSection = document.getElementById('loadingSection');
  const resultsSection = document.getElementById('resultsSection');
  const resultsList = document.getElementById('resultsList');
  const metaInfo = document.getElementById('metaInfo');
  const errorSection = document.getElementById('errorSection');
  const errorText = document.getElementById('errorText');

  let currentFile = null;
  let stream = null;

  function show(el) {
    el.removeAttribute('hidden');
  }

  function hide(el) {
    el.setAttribute('hidden', '');
  }

  function setError(message) {
    errorText.textContent = message || 'Error al procesar la imagen.';
    show(errorSection);
    hide(resultsSection);
  }

  function clearError() {
    hide(errorSection);
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
    cameraVideo.srcObject = null;
    hide(cameraSection);
    show(choiceSection);
  }

  function showPreview(file) {
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    currentFile = file;
    hide(choiceSection);
    hide(cameraSection);
    show(previewSection);
    hide(resultsSection);
    clearError();
  }

  function resetToChoice() {
    currentFile = null;
    if (previewImg.src) URL.revokeObjectURL(previewImg.src);
    previewImg.removeAttribute('src');
    hide(previewSection);
    hide(loadingSection);
    hide(resultsSection);
    clearError();
    show(choiceSection);
  }

  // ——— Cámara ———
  useCameraBtn.addEventListener('click', function () {
    hide(choiceSection);
    show(cameraSection);
    clearError();
    captureBtn.disabled = false;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(function (s) {
        stream = s;
        cameraVideo.srcObject = s;
      })
      .catch(function (err) {
        if (err.name === 'NotAllowedError') {
          setError('Se necesita permiso para usar la cámara. Actívalo en el navegador.');
        } else if (err.name === 'NotFoundError') {
          setError('No se encontró ninguna cámara.');
        } else {
          setError('No se pudo acceder a la cámara: ' + (err.message || err.name));
        }
        show(choiceSection);
        hide(cameraSection);
      });
  });

  stopCameraBtn.addEventListener('click', stopCamera);

  captureBtn.addEventListener('click', function () {
    if (!stream || !cameraVideo.videoWidth) return;
    var w = cameraVideo.videoWidth;
    var h = cameraVideo.videoHeight;
    captureCanvas.width = w;
    captureCanvas.height = h;
    var ctx = captureCanvas.getContext('2d');
    ctx.drawImage(cameraVideo, 0, 0);
    captureCanvas.toBlob(function (blob) {
      if (!blob) return;
      var file = new File([blob], 'captura.jpg', { type: 'image/jpeg' });
      stopCamera();
      showPreview(file);
    }, 'image/jpeg', 0.92);
  });

  switchToUploadBtn.addEventListener('click', function () {
    stopCamera();
    show(choiceSection);
  });

  // ——— Subir archivo ———
  uploadZone.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    var file = this.files[0];
    if (file && file.type.startsWith('image/')) showPreview(file);
    this.value = '';
  });

  uploadZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', function () {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', function (e) {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    var file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) showPreview(file);
  });

  // ——— Clasificar y limpiar ———
  clearBtn.addEventListener('click', resetToChoice);

  classifyBtn.addEventListener('click', async function () {
    if (!currentFile) return;
    show(loadingSection);
    hide(resultsSection);
    clearError();

    var formData = new FormData();
    formData.append('file', currentFile);

    try {
      var res = await fetch('/api/classify', {
        method: 'POST',
        body: formData,
      });
      var data = await res.json();

      hide(loadingSection);

      if (data.error) {
        setError(data.error);
        return;
      }

      resultsList.innerHTML = '';

      if (!data.residuos || data.residuos.length === 0) {
        resultsList.innerHTML = '<p class="text-muted">No se detectaron residuos en la imagen.</p>';
      } else {
        data.residuos.forEach(function (r) {
          var card = document.createElement('div');
          card.className = 'result-card';
          card.innerHTML =
            '<div class="row"><span class="label">Material</span><span class="value">' + escapeHtml(r.material) + '</span></div>' +
            '<div class="row"><span class="label">Origen</span><span class="value">' + escapeHtml(r.origen) + '</span></div>' +
            '<div class="row"><span class="label">Degradabilidad</span><span class="value">' + escapeHtml(r.degradabilidad) + '</span></div>' +
            '<div class="row"><span class="label">Reciclable</span><span class="value ' + (r.reciclable === 'reciclable' ? 'reciclable' : 'no-reciclable') + '">' + escapeHtml(r.reciclable) + '</span></div>' +
            '<div class="row"><span class="label">Confianza</span><span class="value">' + (r.confianza != null ? (r.confianza * 100).toFixed(1) + '%' : '–') + '</span></div>' +
            (r.etiqueta_ocr ? '<div class="row"><span class="label">OCR</span><span class="value">' + escapeHtml(r.etiqueta_ocr) + '</span></div>' : '');
          resultsList.appendChild(card);
        });
      }

      metaInfo.textContent = data.uso_cloud_vision ? 'Enriquecido con Cloud Vision (OCR).' : 'Clasificación en dispositivo (offline).';
      show(resultsSection);
    } catch (err) {
      hide(loadingSection);
      setError(err.message || 'Error de conexión. ¿Está el servidor en marcha?');
    }
  });

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }
})();
