// WebAssembly-based video transcoding with FFmpeg.wasm
export class WebAssemblyTranscoder {
  private ffmpeg: any = null;
  private isInitialized = false;
  private progressCallback: ((progress: number) => void) | null = null;

  async initialize(): Promise<boolean> {
    try {
      // Load FFmpeg.wasm (in production, this would be from npm)
      const ffmpegModule = await import('@ffmpeg/ffmpeg');
      const createFFmpeg = (ffmpegModule as any).default || (ffmpegModule as any).createFFmpeg;
      this.ffmpeg = createFFmpeg({
        log: true,
        corePath: '/ffmpeg-core.js',
        wasmPath: '/ffmpeg-core.wasm'
      });

      await this.ffmpeg.load();
      this.isInitialized = true;
      
      console.log('WebAssembly Transcoder: FFmpeg loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize FFmpeg.wasm:', error);
      return false;
    }
  }

  setProgressCallback(callback: (progress: number) => void) {
    this.progressCallback = callback;
  }

  async transcodeToAV1(
    inputFile: File,
    outputName: string,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<File> {
    if (!this.isInitialized || !this.ffmpeg) {
      throw new Error('Transcoder not initialized');
    }

    const inputFileName = `input.${this.getFileExtension(inputFile.name)}`;
    
    // Write input file to FFmpeg virtual file system
    this.ffmpeg.FS('writeFile', inputFileName, await fetchFile(inputFile));

    // AV1 encoding settings based on quality
    const qualitySettings = {
      low: '-c:v libaom-av1 -crf 35 -b:v 500k -cpu-used 8',
      medium: '-c:v libaom-av1 -crf 30 -b:v 1000k -cpu-used 6',
      high: '-c:v libaom-av1 -crf 25 -b:v 2000k -cpu-used 4'
    };

    const command = [
      '-i', inputFileName,
      ...qualitySettings[quality].split(' '),
      '-c:a libopus',
      '-b:a 128k',
      '-movflags +faststart',
      outputName
    ];

    try {
      await this.runFFmpegCommand(command);
      
      // Get the transcoded file
      const data = this.ffmpeg.FS('readFile', outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      
      return new File([blob], outputName, { type: 'video/mp4' });
    } finally {
      // Cleanup
      this.ffmpeg.FS('unlink', inputFileName);
      this.ffmpeg.FS('unlink', outputName);
    }
  }

  async transcodeToH264(
    inputFile: File,
    outputName: string,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<File> {
    if (!this.isInitialized || !this.ffmpeg) {
      throw new Error('Transcoder not initialized');
    }

    const inputFileName = `input.${this.getFileExtension(inputFile.name)}`;
    this.ffmpeg.FS('writeFile', inputFileName, await fetchFile(inputFile));

    const qualitySettings = {
      low: '-c:v libx264 -crf 28 -preset ultrafast -b:v 800k',
      medium: '-c:v libx264 -crf 23 -preset medium -b:v 1500k',
      high: '-c:v libx264 -crf 18 -preset slow -b:v 3000k'
    };

    const command = [
      '-i', inputFileName,
      ...qualitySettings[quality].split(' '),
      '-c:a aac',
      '-b:a 128k',
      '-movflags +faststart',
      outputName
    ];

    try {
      await this.runFFmpegCommand(command);
      
      const data = this.ffmpeg.FS('readFile', outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      
      return new File([blob], outputName, { type: 'video/mp4' });
    } finally {
      this.ffmpeg.FS('unlink', inputFileName);
      this.ffmpeg.FS('unlink', outputName);
    }
  }

  async transcodeToVP9(
    inputFile: File,
    outputName: string,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<File> {
    if (!this.isInitialized || !this.ffmpeg) {
      throw new Error('Transcoder not initialized');
    }

    const inputFileName = `input.${this.getFileExtension(inputFile.name)}`;
    this.ffmpeg.FS('writeFile', inputFileName, await fetchFile(inputFile));

    const qualitySettings = {
      low: '-c:v libvpx-vp9 -crf 35 -b:v 500k -cpu-used 8',
      medium: '-c:v libvpx-vp9 -crf 30 -b:v 1000k -cpu-used 6',
      high: '-c:v libvpx-vp9 -crf 25 -b:v 2000k -cpu-used 4'
    };

    const command = [
      '-i', inputFileName,
      ...qualitySettings[quality].split(' '),
      '-c:a libopus',
      '-b:a 128k',
      outputName
    ];

    try {
      await this.runFFmpegCommand(command);
      
      const data = this.ffmpeg.FS('readFile', outputName);
      const blob = new Blob([data.buffer], { type: 'video/webm' });
      
      return new File([blob], outputName, { type: 'video/webm' });
    } finally {
      this.ffmpeg.FS('unlink', inputFileName);
      this.ffmpeg.FS('unlink', outputName);
    }
  }

  async optimizeForWeb(
    inputFile: File,
    targetCodec: 'av1' | 'h264' | 'vp9',
    maxWidth: number = 1920,
    maxHeight: number = 1080
  ): Promise<File> {
    if (!this.isInitialized || !this.ffmpeg) {
      throw new Error('Transcoder not initialized');
    }

    const inputFileName = `input.${this.getFileExtension(inputFile.name)}`;
    const outputName = `optimized_${targetCodec}.${targetCodec === 'vp9' ? 'webm' : 'mp4'}`;
    
    this.ffmpeg.FS('writeFile', inputFileName, await fetchFile(inputFile));

    // Get video info first
    const info = await this.getVideoInfo(inputFileName);
    
    // Calculate scaling if needed
    const scaleFilter = this.calculateScale(info.width, info.height, maxWidth, maxHeight);
    
    const codecSettings = {
      av1: ['-c:v', 'libaom-av1', '-crf', '30', '-cpu-used', '6'],
      h264: ['-c:v', 'libx264', '-crf', '23', '-preset', 'medium'],
      vp9: ['-c:v', 'libvpx-vp9', '-crf', '30', '-cpu-used', '6']
    };

    const command = [
      '-i', inputFileName,
      ...scaleFilter,
      ...codecSettings[targetCodec],
      '-c:a', targetCodec === 'vp9' ? 'libopus' : 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputName
    ];

    try {
      await this.runFFmpegCommand(command);
      
      const data = this.ffmpeg.FS('readFile', outputName);
      const mimeType = targetCodec === 'vp9' ? 'video/webm' : 'video/mp4';
      const blob = new Blob([data.buffer], { type: mimeType });
      
      return new File([blob], outputName, { type: mimeType });
    } finally {
      this.ffmpeg.FS('unlink', inputFileName);
      this.ffmpeg.FS('unlink', outputName);
    }
  }

  async createAdaptiveBitrateVersions(
    inputFile: File,
    targetCodec: 'av1' | 'h264' | 'vp9'
  ): Promise<File[]> {
    const qualities = [
      { name: '360p', width: 640, height: 360, bitrate: '800k' },
      { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
      { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' }
    ];

    const files: File[] = [];

    for (const quality of qualities) {
      const outputName = `${targetCodec}_${quality.name}.${targetCodec === 'vp9' ? 'webm' : 'mp4'}`;
      const file = await this.optimizeForWeb(inputFile, targetCodec, quality.width, quality.height);
      files.push(file);
    }

    return files;
  }

  private async runFFmpegCommand(command: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ffmpeg) {
        reject(new Error('FFmpeg not initialized'));
        return;
      }

      this.ffmpeg.setProgress(({ ratio }: { ratio: number }) => {
        if (this.progressCallback) {
          this.progressCallback(Math.round(ratio * 100));
        }
      });

      this.ffmpeg.run(...command)
        .then(() => resolve())
        .catch(reject);
    });
  }

  private async getVideoInfo(fileName: string): Promise<{ width: number; height: number; duration: number }> {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not initialized');
    }

    // Use ffprobe to get video info
    await this.ffmpeg.run('-i', fileName);
    
    // Parse output from FFmpeg logs
    const logs = this.ffmpeg.getLogs();
    const durationMatch = logs.join('').match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
    const resolutionMatch = logs.join('').match(/(\d+)x(\d+)/);

    if (durationMatch && resolutionMatch) {
      const [, hours, minutes, seconds] = durationMatch;
      const [, width, height] = resolutionMatch;
      
      return {
        width: parseInt(width),
        height: parseInt(height),
        duration: parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds)
      };
    }

    // Fallback to default values
    return { width: 1920, height: 1080, duration: 30 };
  }

  private calculateScale(
    currentWidth: number,
    currentHeight: number,
    maxWidth: number,
    maxHeight: number
  ): string[] {
    if (currentWidth <= maxWidth && currentHeight <= maxHeight) {
      return [];
    }

    const aspectRatio = currentWidth / currentHeight;
    let newWidth = maxWidth;
    let newHeight = Math.round(maxWidth / aspectRatio);

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = Math.round(maxHeight * aspectRatio);
    }

    return ['-vf', `scale=${newWidth}:${newHeight}`];
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || 'mp4';
  }

  async getTranscodingStats(originalFile: File, transcodedFile: File): Promise<{
    originalSize: number;
    transcodedSize: number;
    compressionRatio: number;
    sizeReduction: number;
  }> {
    return {
      originalSize: originalFile.size,
      transcodedSize: transcodedFile.size,
      compressionRatio: originalFile.size / transcodedFile.size,
      sizeReduction: ((originalFile.size - transcodedFile.size) / originalFile.size) * 100
    };
  }
}

// Helper function to convert File to Uint8Array for FFmpeg
async function fetchFile(file: File): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as ArrayBuffer;
      resolve(new Uint8Array(result));
    };
    reader.readAsArrayBuffer(file);
  });
}
