// WebCodecs API type definitions for TypeScript
declare global {
  interface VideoEncoder {
    readonly encoding: boolean;
    readonly encodeQueueSize: number;
    
    configure(config: VideoEncoderConfig): void;
    encode(frame: VideoFrame, metadata?: EncodedVideoChunkMetadata): void;
    flush(): Promise<void>;
    close(): void;
    reset(): void;
    
    onerror: ((event: Event) => void) | null;
    onoutput: ((chunk: EncodedVideoChunk, metadata: EncodedVideoChunkMetadata) => void) | null;
  }
  
  interface VideoEncoderConfig {
    codec: string;
    width?: number;
    height?: number;
    bitrate?: number;
    framerate?: number;
    hardwareAcceleration?: 'no-preference' | 'prefer-hardware' | 'prefer-software';
  }
  
  interface EncodedVideoChunk {
    readonly type: EncodedVideoChunkType;
    readonly timestamp: number;
    readonly data: ArrayBuffer;
  }
  
  interface EncodedVideoChunkMetadata {
    decoderConfig?: VideoDecoderConfig;
  }
  
  type EncodedVideoChunkType = 'key' | 'delta';
  
  interface VideoDecoderConfig {
    codec: string;
    codedWidth?: number;
    codedHeight?: number;
    description?: ArrayBuffer;
  }
  
  interface VideoFrame {
    readonly format: VideoPixelFormat;
    readonly codedWidth: number;
    readonly codedHeight: number;
    readonly cropLeft: number;
    readonly cropTop: number;
    readonly cropWidth: number;
    readonly cropHeight: number;
    readonly displayWidth: number;
    readonly displayHeight: number;
    readonly duration?: number;
    readonly timestamp: number;
    readonly colorSpace?: VideoColorSpace;
    
    clone(): VideoFrame;
    close(): void;
    copyTo(imageBitmap: ImageBitmapInit): Promise<ImageBitmap>;
    copyTo(destination: ArrayBuffer, layout: PlaneLayout[]): Promise<void>;
  }
  
  type VideoPixelFormat = string;
  
  interface VideoColorSpace {
    primaries: string;
    transfer: string;
    matrix: string;
    fullRange: boolean;
  }
  
  interface PlaneLayout {
    offset: number;
    stride: number;
  }
  
  interface ImageBitmapInit {
    imageBitmap: ImageBitmap;
  }
  
  var VideoEncoder: {
    prototype: VideoEncoder;
    new(init: VideoEncoderInit): VideoEncoder;
  }
  
  interface VideoEncoderInit {
    output: (chunk: EncodedVideoChunk, metadata: EncodedVideoChunkMetadata) => void;
    error: (e: Error) => void;
  }
}

export {};
