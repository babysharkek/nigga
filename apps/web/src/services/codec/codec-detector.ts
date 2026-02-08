// Advanced codec detection and browser support analysis
export interface CodecSupport {
  av1: boolean;
  h264: boolean;
  vp9: boolean;
  hevc: boolean;
  webCodecs: boolean;
  webAssembly: boolean;
  hardwareAcceleration: boolean;
}

export interface CodecInfo {
  name: string;
  mimeType: string;
  extension: string;
  quality: number; // 1-10 scale
  compression: number; // size reduction percentage vs original
  browserSupport: string[];
  recommended: boolean;
}

export class CodecDetector {
  private static instance: CodecDetector;
  private support: CodecSupport | null = null;

  static getInstance(): CodecDetector {
    if (!CodecDetector.instance) {
      CodecDetector.instance = new CodecDetector();
    }
    return CodecDetector.instance;
  }

  async detectSupport(): Promise<CodecSupport> {
    if (this.support) {
      return this.support;
    }

    const support = {
      av1: await this.checkAV1Support(),
      h264: await this.checkH264Support(),
      vp9: await this.checkVP9Support(),
      hevc: await this.checkHEVCSupport(),
      webCodecs: this.checkWebCodecsSupport(),
      webAssembly: this.checkWebAssemblySupport(),
      hardwareAcceleration: await this.checkHardwareAcceleration()
    };

    this.support = support;
    return support;
  }

  private async checkAV1Support(): Promise<boolean> {
    try {
      // Check MediaSource extension for AV1
      if ('MediaSource' in window && MediaSource.isTypeSupported('video/mp4; codecs=av01.0.05M.08')) {
        return true;
      }
      
      // Check WebCodecs API for AV1
      if ('VideoEncoder' in window) {
        try {
          const encoder = new VideoEncoder({
            output: () => {},
            error: () => {}
          });
          encoder.configure({
            codec: 'av01.0.05M.08',
            width: 1920,
            height: 1080,
            bitrate: 5000000
          });
          encoder.close();
          return true;
        } catch {
          return false;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  private async checkH264Support(): Promise<boolean> {
    try {
      // H.264 is universally supported
      if ('MediaSource' in window && MediaSource.isTypeSupported('video/mp4; codecs=avc1.42E01E')) {
        return true;
      }
      
      if ('VideoEncoder' in window) {
        try {
          const encoder = new VideoEncoder({
            output: () => {},
            error: () => {}
          });
          encoder.configure({
            codec: 'avc1.42E01E',
            width: 1920,
            height: 1080,
            bitrate: 5000000
          });
          encoder.close();
          return true;
        } catch {
          return false;
        }
      }
      
      return true; // Fallback assumption
    } catch {
      return true;
    }
  }

  private async checkVP9Support(): Promise<boolean> {
    try {
      if ('MediaSource' in window && MediaSource.isTypeSupported('video/webm; codecs=vp9')) {
        return true;
      }
      
      if ('VideoEncoder' in window) {
        try {
          const encoder = new VideoEncoder({
            output: () => {},
            error: () => {}
          });
          encoder.configure({
            codec: 'vp09.00.10.08',
            width: 1920,
            height: 1080,
            bitrate: 5000000
          });
          encoder.close();
          return true;
        } catch {
          return false;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  private async checkHEVCSupport(): Promise<boolean> {
    try {
      if ('MediaSource' in window && MediaSource.isTypeSupported('video/mp4; codecs=hvc1.1.6.L93.B0')) {
        return true;
      }
      
      if ('VideoEncoder' in window) {
        try {
          const encoder = new VideoEncoder({
            output: () => {},
            error: () => {}
          });
          encoder.configure({
            codec: 'hvc1.1.6.L93.B0',
            width: 1920,
            height: 1080,
            bitrate: 5000000
          });
          encoder.close();
          return true;
        } catch {
          return false;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  private checkWebCodecsSupport(): boolean {
    return 'VideoEncoder' in window && 'VideoDecoder' in window;
  }

  private checkWebAssemblySupport(): boolean {
    return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
  }

  private async checkHardwareAcceleration(): Promise<boolean> {
    try {
      if (!('VideoEncoder' in window)) {
        return false;
      }
      
      const encoder = new VideoEncoder({
        output: () => {},
        error: () => {}
      });
      
      // Try to configure with hardware acceleration preference
      const config = {
        codec: 'avc1.42E01E',
        width: 1920,
        height: 1080,
        bitrate: 5000000,
        hardwareAcceleration: 'prefer-hardware' as const
      };
      
      const success = encoder.configure(config);
      encoder.close();
      
      return success !== undefined;
    } catch {
      return false;
    }
  }

  getAvailableCodecs(): CodecInfo[] {
    const codecs: CodecInfo[] = [
      {
        name: 'AV1',
        mimeType: 'video/mp4; codecs=av01.0.05M.08',
        extension: 'mp4',
        quality: 9,
        compression: 30, // 30% smaller than H.265
        browserSupport: ['Chrome', 'Edge', 'Firefox', 'Safari M3+'],
        recommended: true
      },
      {
        name: 'H.264',
        mimeType: 'video/mp4; codecs=avc1.42E01E',
        extension: 'mp4',
        quality: 7,
        compression: 0, // Baseline
        browserSupport: ['Chrome', 'Edge', 'Firefox', 'Safari'],
        recommended: true
      },
      {
        name: 'VP9',
        mimeType: 'video/webm; codecs=vp9',
        extension: 'webm',
        quality: 8,
        compression: 20, // 20% smaller than H.264
        browserSupport: ['Chrome', 'Edge', 'Firefox'],
        recommended: true
      },
      {
        name: 'H.265/HEVC',
        mimeType: 'video/mp4; codecs=hvc1.1.6.L93.B0',
        extension: 'mp4',
        quality: 8,
        compression: 25, // 25% smaller than H.264
        browserSupport: ['Safari M3+', 'Edge (limited)'],
        recommended: false
      }
    ];

    return codecs;
  }

  async getBestCodec(): Promise<CodecInfo | null> {
    const support = await this.detectSupport();
    const availableCodecs = this.getAvailableCodecs();

    // Priority order: AV1 > VP9 > H.264 > H.265
    const priorityOrder = ['AV1', 'VP9', 'H.264', 'H.265'];

    for (const codecName of priorityOrder) {
      const codec = availableCodecs.find(c => c.name === codecName);
      if (codec && this.isCodecSupported(codec, support)) {
        return codec;
      }
    }

    return null;
  }

  private isCodecSupported(codec: CodecInfo, support: CodecSupport): boolean {
    switch (codec.name) {
      case 'AV1':
        return support.av1;
      case 'H.264':
        return support.h264;
      case 'VP9':
        return support.vp9;
      case 'H.265/HEVC':
        return support.hevc;
      default:
        return false;
    }
  }

  getCodecFromFile(file: File): CodecInfo | null {
    const type = file.type.toLowerCase();
    
    if (type.includes('av1') || type.includes('av01')) {
      return this.getAvailableCodecs().find(c => c.name === 'AV1') || null;
    }
    
    if (type.includes('h264') || type.includes('avc')) {
      return this.getAvailableCodecs().find(c => c.name === 'H.264') || null;
    }
    
    if (type.includes('vp9')) {
      return this.getAvailableCodecs().find(c => c.name === 'VP9') || null;
    }
    
    if (type.includes('h265') || type.includes('hevc') || type.includes('hvc')) {
      return this.getAvailableCodecs().find(c => c.name === 'H.265/HEVC') || null;
    }
    
    return null;
  }

  async getOptimalSettings(codec: CodecInfo, originalFile: File): Promise<any> {
    const video = document.createElement('video');
    const url = URL.createObjectURL(originalFile);
    
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        
        const settings = {
          codec: codec.mimeType,
          width: video.videoWidth,
          height: video.videoHeight,
          bitrate: this.calculateOptimalBitrate(video.videoWidth, video.videoHeight, codec.quality),
          framerate: 30,
          keyframeInterval: 2,
          hardwareAcceleration: 'prefer-hardware' as const
        };
        
        resolve(settings);
      };
      
      video.src = url;
    });
  }

  private calculateOptimalBitrate(width: number, height: number, quality: number): number {
    const pixels = width * height;
    const baseBitrate = pixels * 0.1; // Base: 0.1 bits per pixel
    
    // Adjust by quality (1-10 scale)
    const qualityMultiplier = quality / 7; // 7 is baseline
    
    return Math.round(baseBitrate * qualityMultiplier);
  }
}
