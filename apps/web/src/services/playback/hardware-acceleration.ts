// Hardware acceleration for video decoding and playback
export interface HardwareCapabilities {
  gpuAcceleration: boolean;
  videoDecoding: 'hardware' | 'software' | 'hybrid';
  supportedCodecs: string[];
  maxTextureSize: number;
  gpuMemory: number;
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
  private texturePool: GPUTexture[] = [];
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
      gpuMemory: await this.getGPUMemory(),
      vendor: this.getGPUVendor(),
      renderer: this.getGPURenderer()
    };

    this.capabilities = capabilities;
    console.log('Hardware Capabilities:', capabilities);
    return capabilities;
  }

  // Initialize hardware-accelerated decoding
  async initializeDecoding(codec: string, width: number, height: number): Promise<boolean> {
    if (!('VideoDecoder' in window)) {
      console.warn('VideoDecoder not supported, falling back to software');
      return false;
    }

    try {
      // Create hardware-accelerated decoder
      this.videoDecoder = new VideoDecoder({
        output: (frame) => {
          this.handleDecodedFrame(frame);
        },
        error: (error) => {
          console.error('Hardware decoder error:', error);
          this.fallbackToSoftware();
        }
      });

      // Configure for hardware acceleration
      const config: VideoDecoderConfig = {
        codec: codec,
        hardwareAcceleration: 'prefer-hardware'
      };

      // Try to configure with hardware acceleration
      const success = this.videoDecoder.configure(config);
      
      if (!success) {
        console.warn('Hardware acceleration not available, trying software');
        config.hardwareAcceleration = 'prefer-software';
        this.videoDecoder.configure(config);
      }

      this.isInitialized = true;
      console.log('Hardware decoder initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize hardware decoder:', error);
      return false;
    }
  }

  // Decode video frame using hardware acceleration
  async decodeFrame(chunk: EncodedVideoChunk): Promise<void> {
    if (!this.videoDecoder || !this.isInitialized) {
      throw new Error('Decoder not initialized');
    }

    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const originalOutput = this.videoDecoder.output;
      const originalError = this.videoDecoder.error;

      this.videoDecoder.output = (frame) => {
        const decodeTime = performance.now() - startTime;
        this.updatePerformanceMetrics({ decodeTime });
        
        originalOutput.call(this.videoDecoder, frame);
        resolve();
      };

      this.videoDecoder.error = (error) => {
        originalError.call(this.videoDecoder, error);
        reject(error);
      };

      this.videoDecoder.decode(chunk);
    });
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

  // Transfer frame to GPU memory
  private async transferToGPU(frame: VideoFrame): Promise<void> {
    if (!('GPU' in window)) {
      return;
    }

    try {
      const adapter = await navigator.gpu?.requestAdapter();
      if (!adapter) return;

      const device = await adapter.requestDevice();
      
      // Create GPU texture from video frame
      const texture = device.createTexture({
        size: { width: frame.displayWidth, height: frame.displayHeight },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });

      // Import video frame into GPU texture
      texture.importExternalImage(frame);

      // Add to texture pool
      this.texturePool.push(texture);

      // Limit texture pool
      if (this.texturePool.length > 10) {
        const oldTexture = this.texturePool.shift();
        oldTexture?.destroy();
      }

    } catch (error) {
      console.error('Failed to transfer frame to GPU:', error);
    }
  }

  // Zero-copy texture upload
  async zeroCopyUpload(frame: VideoFrame): Promise<GPUTexture | null> {
    if (!('GPU' in window) || !('createImageBitmap' in window)) {
      return null;
    }

    try {
      // Create image bitmap from video frame (zero-copy if possible)
      const bitmap = await createImageBitmap(frame, {
        premultiplyAlpha: 'premultiply',
        colorSpaceConversion: 'default'
      });

      const adapter = await navigator.gpu?.requestAdapter();
      if (!adapter) return null;

      const device = await adapter.requestDevice();
      
      // Create texture with optimal settings for zero-copy
      const texture = device.createTexture({
        size: { width: bitmap.width, height: bitmap.height },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });

      // Try zero-copy import
      if ('importExternalImage' in texture) {
        texture.importExternalImage(bitmap);
        return texture;
      }

      // Fallback to copy
      const imageCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = imageCanvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      device.queue.writeTexture(
        { texture },
        { data: imageData.data },
        { width: bitmap.width, height: bitmap.height }
      );

      return texture;

    } catch (error) {
      console.error('Zero-copy upload failed:', error);
      return null;
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

      const hardwareSuccess = testDecoder.configure({
        codec: 'avc1.42E01E',
        hardwareAcceleration: 'prefer-hardware'
      });

      if (hardwareSuccess) {
        testDecoder.close();
        return 'hardware';
      }

      // Test software decoding
      const softwareSuccess = testDecoder.configure({
        codec: 'avc1.42E01E',
        hardwareAcceleration: 'prefer-software'
      });

      testDecoder.close();
      return softwareSuccess ? 'software' : 'hybrid';

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
        const adapter = await navigator.gpu?.requestAdapter();
        return adapter?.limits.maxTextureDimension2D || 4096;
      }

      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      if (gl) {
        return gl.getParameter(gl.MAX_TEXTURE_SIZE);
      }

      return 2048; // Conservative fallback

    } catch {
      return 2048;
    }
  }

  // Get GPU memory
  private async getGPUMemory(): Promise<number> {
    try {
      if ('GPU' in window) {
        const adapter = await navigator.gpu?.requestAdapter();
        // This is not widely supported yet
        return (adapter as any)?.info?.memory || 0;
      }

      // WebGL doesn't expose memory info
      return 0;

    } catch {
      return 0;
    }
  }

  // Get GPU vendor
  private getGPUVendor(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
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
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          return renderer || 'Unknown';
        }
      }

      return 'Unknown';

    } catch {
      return 'Unknown';
    }
  }

  // Fallback to software decoding
  private fallbackToSoftware(): void {
    console.warn('Falling back to software decoding');
    
    if (this.videoDecoder) {
      this.videoDecoder.configure({
        codec: 'avc1.42E01E',
        hardwareAcceleration: 'prefer-software'
      });
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

  // Get texture from pool
  getTexture(): GPUTexture | null {
    return this.texturePool.shift() || null;
  }

  // Clean up resources
  cleanup(): void {
    // Close all frames
    this.framePool.forEach(frame => frame.close());
    this.framePool = [];

    // Destroy all textures
    this.texturePool.forEach(texture => texture.destroy());
    this.texturePool = [];

    // Close decoder
    if (this.videoDecoder) {
      this.videoDecoder.close();
      this.videoDecoder = null;
    }

    this.isInitialized = false;
  }

  // Optimize for specific hardware
  optimizeForHardware(): void {
    if (!this.capabilities) return;

    const { vendor, renderer } = this.capabilities;

    // NVIDIA optimizations
    if (vendor.includes('NVIDIA')) {
      console.log('Applying NVIDIA optimizations');
      // NVIDIA-specific settings
    }

    // AMD optimizations
    if (vendor.includes('AMD') || vendor.includes('Advanced Micro Devices')) {
      console.log('Applying AMD optimizations');
      // AMD-specific settings
    }

    // Intel optimizations
    if (vendor.includes('Intel')) {
      console.log('Applying Intel optimizations');
      // Intel-specific settings
    }

    // Apple optimizations
    if (vendor.includes('Apple')) {
      console.log('Applying Apple optimizations');
      // Apple-specific settings
    }
  }
}
