// Rounded-rectangle border mask. A black frame around the canvas with a
// rounded inner edge — hides wire/bird spillover at the curved window edges
// of the train car. Outer edge is the canvas rectangle; inner edge is an
// inset rounded rectangle.
//
// Controls:
//   B          enter/exit border-adjust mode
//   While in border-adjust mode:
//     Up/Down    increase/decrease thickness
//     Left/Right increase/decrease inner-corner radius
//
// Defaults live in config.border. State is exported via E and accepted via
// drag-drop import as part of flocking-scene.json.

let borderThickness = 0;
let borderCornerRadius = 0;
let borderEditMode = false;

function initBorder() {
  borderThickness = config.border.defaultThickness;
  borderCornerRadius = config.border.defaultCornerRadius;
}

// Draw the frame: outer canvas rect with a rounded inner rect punched out.
// Uses the underlying 2D context's even-odd fill rule.
function drawBorder() {
  if (borderThickness <= 0) return;
  const ctx = drawingContext;
  const t = borderThickness;
  // Inner-rect dimensions; clamp the corner radius so it never exceeds half
  // the inner rect's shorter side.
  const innerW = width - 2 * t;
  const innerH = height - 2 * t;
  if (innerW <= 0 || innerH <= 0) {
    // Frame thicker than canvas — just fill black.
    push();
    noStroke();
    fill(0);
    rect(0, 0, width, height);
    pop();
    return;
  }
  const r = constrain(borderCornerRadius, 0, min(innerW, innerH) / 2);

  ctx.save();
  ctx.beginPath();
  // Outer rectangle, clockwise.
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  // Inner rounded rectangle. Drawing it in the same path with even-odd fill
  // produces a frame.
  const x0 = t;
  const y0 = t;
  const x1 = t + innerW;
  const y1 = t + innerH;
  ctx.moveTo(x0 + r, y0);
  ctx.lineTo(x1 - r, y0);
  ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
  ctx.lineTo(x1, y1 - r);
  ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
  ctx.lineTo(x0 + r, y1);
  ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
  ctx.lineTo(x0, y0 + r);
  ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill('evenodd');
  ctx.restore();

  // Subtle on-screen hint while editing — a 1px red outline at the inner edge.
  if (borderEditMode) {
    push();
    noFill();
    stroke(255, 80, 80);
    strokeWeight(1);
    rect(x0, y0, innerW, innerH, r);
    pop();
  }
}

function handleBorderKey(k, code) {
  if (matchesBinding(config.controls.toggleBorderEdit, k, code)) {
    borderEditMode = !borderEditMode;
    console.log('border edit mode:', borderEditMode);
    return true;
  }
  if (!borderEditMode) return false;

  const { thicknessStep, curvatureStep, minThickness, minCornerRadius } = config.border;
  if (code === UP_ARROW) {
    borderThickness = max(minThickness, borderThickness + thicknessStep);
    return true;
  }
  if (code === DOWN_ARROW) {
    borderThickness = max(minThickness, borderThickness - thicknessStep);
    return true;
  }
  if (code === LEFT_ARROW) {
    borderCornerRadius = max(minCornerRadius, borderCornerRadius - curvatureStep);
    return true;
  }
  if (code === RIGHT_ARROW) {
    borderCornerRadius = max(minCornerRadius, borderCornerRadius + curvatureStep);
    return true;
  }
  return false;
}

function currentBorderConfig() {
  return {
    thicknessRatio: width > 0 ? borderThickness / width : 0,
    cornerRadiusRatio: width > 0 ? borderCornerRadius / width : 0,
  };
}

function applyBorderConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') return;
  if (typeof cfg.thicknessRatio === 'number') {
    borderThickness = max(config.border.minThickness, cfg.thicknessRatio * width);
  }
  if (typeof cfg.cornerRadiusRatio === 'number') {
    borderCornerRadius = max(config.border.minCornerRadius, cfg.cornerRadiusRatio * width);
  }
}

// Allowed left-edge x-range for a bird so it stays inside the bezel.
// y-range stays controlled per-wire (use wire-y nudge to keep top/bottom rows
// out of the rounded corners).
// Allowed left-edge x range that respects both the bezel inset (this module)
// and the existing per-side margin used elsewhere in the project.
function birdSafeXMin() {
  return max(0, borderThickness);
}
function birdSafeXMax() {
  // Largest left-edge x such that the bird's right edge is still inside the
  // inner rect AND inside the legacy right-side margin. Callers should call
  // random(birdSafeXMin(), birdSafeXMax()).
  return min(width - borderThickness - birdWidth, width - margin - birdWidth);
}
