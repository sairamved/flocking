// Center-mask: a black vertical band covering the pole between the two train
// windows we're projecting onto. While enabled, birds must not land or scoot
// into the band (they may still fly through it — the band visually hides them,
// which is the intended "behind the pole" effect).
//
// Controls:
//   R          toggle mask on/off
//   Up/Down    increase/decrease width  (only when enabled)
//   Left/Right move band left/right     (only when enabled)
//   E          export current config as flocking-mask.json
//
// Defaults and step sizes live in `config.mask`. Drop a previously-exported
// flocking-mask.json onto the window to load a saved configuration for the
// current session.

let maskEnabled;
let maskCenterX = 0;
let maskWidth;

function initMask() {
  maskEnabled = config.mask.enabledByDefault;
  maskCenterX = config.mask.defaultCenterXRatio * width;
  maskWidth = config.mask.defaultWidth;
  installMaskFileDrop();
}

function onWindowResizedMask(prevWidth) {
  if (prevWidth > 0) {
    const ratio = maskCenterX / prevWidth;
    maskCenterX = ratio * width;
  } else {
    maskCenterX = config.mask.defaultCenterXRatio * width;
  }
}

function drawMask() {
  if (!maskEnabled) return;
  push();
  noStroke();
  fill(0);
  rectMode(CENTER);
  rect(maskCenterX, height / 2, maskWidth, height);
  pop();
}

function isInMaskedBand(x) {
  if (!maskEnabled) return false;
  const bandLeft = maskCenterX - maskWidth / 2;
  const bandRight = maskCenterX + maskWidth / 2;
  return x + birdWidth > bandLeft && x < bandRight;
}

function handleMaskKey(k, code) {
  const controls = config.controls;
  if (matchesBinding(controls.toggleMask, k, code)) {
    maskEnabled = !maskEnabled;
    console.log('mask toggled to:', maskEnabled);
    return true;
  }
  if (matchesBinding(controls.exportMask, k, code)) {
    exportMaskConfig();
    return true;
  }
  if (!maskEnabled) return false;

  const { widthStep, moveStep, minWidth } = config.mask;
  if (matchesBinding(controls.maskWidthUp, k, code)) {
    maskWidth += widthStep;
    return true;
  }
  if (matchesBinding(controls.maskWidthDown, k, code)) {
    maskWidth = max(minWidth, maskWidth - widthStep);
    return true;
  }
  if (matchesBinding(controls.maskMoveLeft, k, code)) {
    maskCenterX = max(maskWidth / 2, maskCenterX - moveStep);
    return true;
  }
  if (matchesBinding(controls.maskMoveRight, k, code)) {
    maskCenterX = min(width - maskWidth / 2, maskCenterX + moveStep);
    return true;
  }
  return false;
}

// Serialize as ratios of canvas width so the same JSON renders consistently
// across different display sizes (e.g. dev laptop vs. on-site projector).
function currentMaskConfig() {
  return {
    enabled: maskEnabled,
    centerXRatio: width > 0 ? maskCenterX / width : config.mask.defaultCenterXRatio,
    widthRatio: width > 0 ? maskWidth / width : 0,
    canvasWidth: width,
    canvasHeight: height,
    exportedAt: new Date().toISOString(),
  };
}

function applyMaskConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') return;
  if (typeof cfg.enabled === 'boolean') maskEnabled = cfg.enabled;
  if (typeof cfg.centerXRatio === 'number') maskCenterX = cfg.centerXRatio * width;
  if (typeof cfg.widthRatio === 'number') {
    maskWidth = max(config.mask.minWidth, cfg.widthRatio * width);
  }
  maskCenterX = constrain(maskCenterX, maskWidth / 2, width - maskWidth / 2);
}

function exportMaskConfig() {
  const cfg = currentMaskConfig();
  const json = JSON.stringify(cfg, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flocking-mask.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('mask config exported:', cfg);
}

let maskDropInstalled = false;
function installMaskFileDrop() {
  if (maskDropInstalled) return;
  maskDropInstalled = true;
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const cfg = JSON.parse(reader.result);
        applyMaskConfig(cfg);
        console.log('mask config loaded from dropped file:', cfg);
      } catch (err) {
        console.warn('dropped file is not a valid mask config:', err);
      }
    };
    reader.readAsText(file);
  });
}
