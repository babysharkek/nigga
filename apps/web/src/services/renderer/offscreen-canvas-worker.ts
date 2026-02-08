// OffscreenCanvas worker for 60fps timeline rendering
let canvas: OffscreenCanvas;
let ctx: OffscreenCanvasRenderingContext2D;
let width: number;
let height: number;
let animationId: number;

interface RenderData {
  timeline: any;
  previewFrame: VideoFrame | null;
  currentTime: number;
  tracks: any[];
}

self.onmessage = (e) => {
  if (e.data.canvas) {
    // Initialize offscreen canvas
    canvas = e.data.canvas;
    ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    width = canvas.width;
    height = canvas.height;
    
    // Start render loop
    render();
  } else if (e.data.renderData) {
    // Update render data
    updateRenderData(e.data.renderData);
  }
};

function updateRenderData(data: RenderData) {
  // Update internal state with new timeline data
  // This will be used in the render loop
}

function render() {
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw timeline background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  // Draw timeline tracks
  drawTimeline(ctx);

  // Draw video preview
  drawVideoPreview(ctx);

  // Draw playhead
  drawPlayhead(ctx);

  // Continue render loop at 60fps
  animationId = requestAnimationFrame(render);
}

function drawTimeline(ctx: OffscreenCanvasRenderingContext2D | null) {
  if (!ctx) return;
  
  // Draw track backgrounds
  ctx.fillStyle = '#2a2a2a';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(0, i * 60, width, 50);
  }

  // Draw track separators
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 60);
    ctx.lineTo(width, i * 60);
    ctx.stroke();
  }

  // Draw time markers
  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  for (let i = 0; i < width; i += 100) {
    const time = (i / 100) * 5; // 5 seconds per 100px
    ctx.fillText(`${time}s`, i, height - 5);
  }
}

function drawVideoPreview(ctx: OffscreenCanvasRenderingContext2D | null) {
  if (!ctx) return;
  
  // Draw video preview in dedicated area
  const previewX = 10;
  const previewY = 10;
  const previewWidth = 320;
  const previewHeight = 180;

  ctx.fillStyle = '#000';
  ctx.fillRect(previewX, previewY, previewWidth, previewHeight);

  // TODO: Draw actual video frame when available
  ctx.fillStyle = '#333';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Video Preview', previewX + previewWidth/2, previewY + previewHeight/2);
}

function drawPlayhead(ctx: OffscreenCanvasRenderingContext2D | null) {
  if (!ctx) return;
  
  const playheadX = 100; // This should be based on current time
  
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, height);
  ctx.stroke();
}

// Cleanup
self.addEventListener('close', () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
