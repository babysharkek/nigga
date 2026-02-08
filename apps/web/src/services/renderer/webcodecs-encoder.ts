import { VideoEncoder, VideoEncoderConfig, EncodedVideoChunk } from 'webcodecs';

export class WebCodecsEncoder {
  private encoder: VideoEncoder;
  private chunks: EncodedVideoChunk[] = [];
  private resolvePromise: ((value: Blob) => void) | null = null;

  constructor(config: Partial<VideoEncoderConfig>) {
    this.encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        this.chunks.push(chunk);
        if (metadata.decoderConfig) {
          // Final chunk, create blob
          const blob = new Blob(this.chunks.map(c => c.data), { type: 'video/mp4' });
          if (this.resolvePromise) {
            this.resolvePromise(blob);
            this.resolvePromise = null;
          }
        }
      },
      error: (e) => {
        console.error('WebCodecs encoder error:', e);
        if (this.resolvePromise) {
          this.resolvePromise(new Blob());
          this.resolvePromise = null;
        }
      }
    });

    const defaultConfig: VideoEncoderConfig = {
      codec: 'avc1.64001F', // H.264 High Profile
      width: 1920,
      height: 1080,
      bitrate: 5_000_000,
      framerate: 30,
      hardwareAcceleration: 'prefer-hardware'
    };

    this.encoder.configure({ ...defaultConfig, ...config });
  }

  async encodeVideo(frames: VideoFrame[]): Promise<Blob> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.chunks = [];

      for (const frame of frames) {
        this.encoder.encode(frame);
        frame.close();
      }

      this.encoder.flush();
    });
  }

  close() {
    this.encoder.close();
  }
}
