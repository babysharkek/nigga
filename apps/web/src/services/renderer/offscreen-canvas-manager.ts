// Main thread manager for OffscreenCanvas
export class OffscreenCanvasManager {
  private worker: Worker | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isInitialized = false;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement;
  }

  async initialize(): Promise<boolean> {
    if (!this.canvas) return false;

    try {
      // Create worker
      this.worker = new Worker('/services/renderer/offscreen-canvas-worker.js');
      
      // Transfer canvas control to worker
      const offscreen = this.canvas.transferControlToOffscreen();
      this.worker.postMessage({ canvas: offscreen }, [offscreen]);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize OffscreenCanvas:', error);
      return false;
    }
  }

  updateTimelineData(data: any) {
    if (!this.worker || !this.isInitialized) return;
    
    this.worker.postMessage({
      type: 'updateTimeline',
      data
    });
  }

  updatePreviewFrame(frame: VideoFrame) {
    if (!this.worker || !this.isInitialized) return;
    
    this.worker.postMessage({
      type: 'updatePreview',
      frame
    });
  }

  updateTime(currentTime: number) {
    if (!this.worker || !this.isInitialized) return;
    
    this.worker.postMessage({
      type: 'updateTime',
      currentTime
    });
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isInitialized = false;
  }
}
