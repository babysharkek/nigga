// Simplified hardware acceleration for video decoding and playback
export interface HardwareCapabilities {
  gpuAcceleration: boolean;
  videoDecoding: 'hardware' | 'software' | 'hybrid';
  supportedCodecs: string[];
  maxTextureSize: number;
  vendor: string;
  renderer: string;
}

export interface DecodingPerformance {
  fps: number;
  frameTime: number;
  gpuUtilization: number;
  memoryUsage: number;
  droppedFrames: number;
  decodeTime: number;
}

export class HardwareAcceleration {
  private capabilities: HardwareCapabilities | null = null;
  private videoDecoder: VideoDecoder | null = null;
  private framePool: VideoFrame[] = [];
  private performanceMetrics: DecodingPerformance;
  private isInitialized = false;

  constructor() {
    this.performanceMetrics = {
      fps: 0,
      frameTime: 0,
      gpuUtilization: 0,
      memoryUsage: 0,
      droppedFrames: 0,
      decodeTime: 0
    };
  }

  // Detect hardware capabilities
  async detectCapabilities(): Promise<HardwareCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const capabilities: HardwareCapabilities = {
      gpuAcceleration: await this.checkGPUAcceleration(),
      videoDecoding: await this.checkVideoDecoding(),
      supportedCodecs: await this.getSupportedCodecs(),
      maxTextureSize: await this.getMaxTextureSize(),
      vendor: this.getGPUVendor(),
      renderer: this.getGPURenderer()
    };

    this.capabilities = capabilities;
    console.log('Hardware Capabilities:', capabilities);
    return capabilities;
  }

  // Initialize hardware-acerated decoding
  async initializeDecoding(codec: string): Promise<boolean> {
    if (!('VideoDecoder' in window)) {
      console.warn('VideoDecoder not supported, falling back to software');
      return false;
    }

    try {
      // Create hardware-accelerated decoder
      this.videoDecoder = new VideoDecoder({
        output: (frame: VideoFrame) => {
          this.handleDecodedFrame(frame);
        },
        error: (error: Error) => {
          console.error('Hardware decoder error:', error);
        }
      });

      // Configure for hardware acceleration
      const config: VideoDecoderConfig = {
        codec: codec,
        hardwareAcceleration: 'prefer-hardware'
      };

      this.videoDecoder.configure(config);
      this.isInitialized = true;
      console.log('Hardware decoder initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize hardware decoder:', error);
      return false;
    }
  }

  // Handle decoded frame
  private handleDecodedFrame(frame: VideoFrame): void {
    // Add to frame pool
    this.framePool.push(frame);

    // Limit pool size
    if (this.framePool.length > 30) {
      const oldFrame = this.framePool.shift();
      oldFrame?.close();
    }

    // Transfer to GPU if possible
    this.transferToGPU(frame);
  }

  // Transfer frame to GPU memory (simplified)
  private async transferToGPU(frame: VideoFrame): Promise<void> {
    if (!('createImageBitmap' in window)) {
      return;
    }

    try {
      // Create image bitmap from video frame
      await createImageBitmap(frame, {
        premultiplyAlpha: 'premultiply',
        colorSpaceConversion: 'default'
      });
      
    } catch (error) {
      console.error('Failed to transfer frame to GPU:', error);
    }
  }

  // Check GPU acceleration availability
  private async checkGPUAcceleration(): Promise<boolean> {
    try {
      // Check for WebGPU
      if ('GPU' in window) {
        const adapter = await navigator.gpu?.requestAdapter();
        return !!adapter;
      }

      // Check for WebGL2
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      return !!gl;

    } catch {
      return false;
    }
  }

  // Check video decoding capabilities
  private async checkVideoDecoding(): Promise<'hardware' | 'software' | 'hybrid'> {
    try {
      if (!('VideoDecoder' in window)) {
        return 'software';
      }

      // Test hardware decoding
      const testDecoder = new VideoDecoder({
        output: () => {},
        error: () => {}
      });

      try {
        testDecoder.configure({
          codec: 'avc1.42E01E',
          hardwareAcceleration: 'prefer-hardware'
        });
        testDecoder.close();
        return 'hardware';
      } catch {
        // Test software decoding
        try {
          testDecoder.configure({
            codec: 'avc1.42E01E',
            hardwareAcceleration: 'prefer-software'
          });
          testDecoder.close();
          return 'software';
        } catch {
          return 'hybrid';
        }
      }

    } catch {
      return 'software';
    }
  }

  // Get supported codecs
  private async getSupportedCodecs(): Promise<string[]> {
    const codecs = [];
    
    if ('MediaSource' in window) {
      const testCodecs = [
        'video/mp4; codecs=avc1.42E01E', // H.264
        'video/mp4; codecs=hev1.1.6.L93.B0', // H.265
        'video/mp4; codecs=av01.0.05M.08', // AV1
        'video/webm; codecs=vp9', // VP9
        'video/webm; codecs=vp8', // VP8
      ];

      for (const codec of testCodecs) {
        if (MediaSource.isTypeSupported(codec)) {
          codecs.push(codec);
        }
      }
    }

    return codecs;
  }

  // Get maximum texture size
  private async getMaxTextureSize(): Promise<number> {
    try {
      if ('GPU' in window) {
        return 4096; // Conservative fallback for WebGPU
      }

      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      if (gl) {
        return (gl as any).getParameter((gl as any).MAX_TEXTURE_SIZE);
      }

      return 2048; // Conservative fallback

    } catch {
      return 2048;
    }
  }

  // Get GPU vendor
  private getGPUVendor(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          return vendor || 'Unknown';
        }
      }

      return 'Unknown';

    } catch {
      return 'Unknown';
    }
  }

  // Get GPU renderer
  private getGPURenderer(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          return renderer || 'Unknown';
        }
      }

      return 'Unknown';

    } catch {
      return 'Unknown';
    }
  }

  // Update performance metrics
  private updatePerformanceMetrics(metrics: Partial<DecodingPerformance>): void {
    Object.assign(this.performanceMetrics, metrics);
  }

  // Get current performance metrics
  getPerformanceMetrics(): DecodingPerformance {
    return { ...this.performanceMetrics };
  }

  // Get frame from pool
  getFrame(): VideoFrame | null {
    return this.framePool.shift() || null;
  }

  // Clean up resources
  cleanup(): void {
    // Close all frames
    this.framePool.forEach(frame => frame.close());
    this.framePool = [];

    // Close decoder
    if (this.videoDecoder) {
      this.videoDecoder.close();
      this.videoDecoder = null;
    }

    this.isInitialized = false;
  }
}
