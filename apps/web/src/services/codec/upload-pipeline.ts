// Complete upload pipeline: Upload → Codec Detection → Transcode → Optimize → Store
import { CodecDetector, CodecInfo } from './codec-detector';
import { WebAssemblyTranscoder } from './webassembly-transcoder';

export interface UploadProgress {
  stage: 'uploading' | 'detecting' | 'transcoding' | 'optimizing' | 'storing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  bytesUploaded?: number;
  totalBytes?: number;
}

export interface TranscodeOptions {
  targetCodec: 'av1' | 'h264' | 'vp9';
  quality: 'low' | 'medium' | 'high';
  optimizeForWeb: boolean;
  createAdaptiveBitrate: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export interface UploadResult {
  success: boolean;
  originalFile: File;
  transcodedFiles: File[];
  stats: {
    originalSize: number;
    totalTranscodedSize: number;
    compressionRatio: number;
    sizeReduction: number;
    processingTime: number;
  };
  metadata: {
    originalCodec: string;
    targetCodec: string;
    resolution: { width: number; height: number };
    duration: number;
    bitrate: number;
  };
}

export class UploadPipeline {
  private codecDetector: CodecDetector;
  private transcoder: WebAssemblyTranscoder;
  private progressCallback: ((progress: UploadProgress) => void) | null = null;

  constructor() {
    this.codecDetector = CodecDetector.getInstance();
    this.transcoder = new WebAssemblyTranscoder();
  }

  setProgressCallback(callback: (progress: UploadProgress) => void) {
    this.progressCallback = callback;
  }

  async processUpload(
    file: File,
    options: Partial<TranscodeOptions> = {}
  ): Promise<UploadResult> {
    const startTime = performance.now();
    
    // Default options
    const defaultOptions: TranscodeOptions = {
      targetCodec: 'av1',
      quality: 'medium',
      optimizeForWeb: true,
      createAdaptiveBitrate: false,
      maxWidth: 1920,
      maxHeight: 1080,
      ...options
    };

    try {
      // Stage 1: Upload (client-side processing, so this is just file validation)
      this.updateProgress('uploading', 10, 'Validating file...');
      await this.validateFile(file);

      // Stage 2: Codec Detection
      this.updateProgress('detecting', 20, 'Detecting codec and analyzing file...');
      const detectedCodec = this.codecDetector.getCodecFromFile(file);
      const bestCodec = await this.codecDetector.getBestCodec();
      
      // Use detected codec if it's optimal, otherwise use best available
      const targetCodec = detectedCodec?.recommended ? detectedCodec.name as 'av1' | 'h264' | 'vp9' : defaultOptions.targetCodec;

      // Stage 3: Transcoding
      this.updateProgress('transcoding', 30, `Transcoding to ${targetCodec.toUpperCase()}...`);
      
      // Initialize transcoder
      const transcoderReady = await this.transcoder.initialize();
      if (!transcoderReady) {
        throw new Error('Failed to initialize transcoder');
      }

      // Set up progress callback for transcoding
      this.transcoder.setProgressCallback((progress) => {
        this.updateProgress('transcoding', 30 + (progress * 0.4), `Transcoding... ${progress}%`);
      });

      let transcodedFiles: File[] = [];

      if (defaultOptions.createAdaptiveBitrate) {
        // Create multiple bitrate versions
        transcodedFiles = await this.transcoder.createAdaptiveBitrateVersions(file, targetCodec);
      } else {
        // Single optimized version
        const optimizedFile = await this.transcoder.optimizeForWeb(
          file,
          targetCodec,
          defaultOptions.maxWidth,
          defaultOptions.maxHeight
        );
        transcodedFiles.push(optimizedFile);
      }

      // Stage 4: Optimization
      this.updateProgress('optimizing', 80, 'Optimizing for web delivery...');
      
      // Additional optimizations could be added here
      const optimizedFiles = await this.applyAdditionalOptimizations(transcodedFiles, targetCodec);

      // Stage 5: Store (in real app, this would upload to cloud storage)
      this.updateProgress('storing', 90, 'Preparing files for storage...');
      
      const processingTime = performance.now() - startTime;
      
      // Calculate stats
      const originalSize = file.size;
      const totalTranscodedSize = optimizedFiles.reduce((sum, f) => sum + f.size, 0);
      
      const result: UploadResult = {
        success: true,
        originalFile: file,
        transcodedFiles: optimizedFiles,
        stats: {
          originalSize,
          totalTranscodedSize,
          compressionRatio: originalSize / totalTranscodedSize,
          sizeReduction: ((originalSize - totalTranscodedSize) / originalSize) * 100,
          processingTime
        },
        metadata: {
          originalCodec: detectedCodec?.name || 'Unknown',
          targetCodec,
          resolution: { width: 1920, height: 1080 }, // Would be extracted from actual video
          duration: 30, // Would be extracted from actual video
          bitrate: 5000 // Would be calculated
        }
      };

      this.updateProgress('complete', 100, 'Processing complete!');
      return result;

    } catch (error) {
      this.updateProgress('error', 0, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async validateFile(file: File): Promise<void> {
    // Check file size (max 2GB for demo)
    if (file.size > 2 * 1024 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 2GB.');
    }

    // Check file type
    const validTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska'
    ];

    if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
      throw new Error('Invalid file type. Please upload a video file.');
    }

    // Check if we can read the file
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file.slice(0, 1024)); // Just read first 1KB to check
    });
  }

  private async applyAdditionalOptimizations(
    files: File[],
    codec: string
  ): Promise<File[]> {
    // Additional optimizations could include:
    // - Audio normalization
    // - Thumbnail generation
    // - Metadata cleanup
    // - Fast start optimization
    
    return files; // For now, return as-is
  }

  private updateProgress(stage: UploadProgress['stage'], progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({
        stage,
        progress: Math.round(progress),
        message
      });
    }
  }

  // Get recommended settings based on file and browser capabilities
  async getRecommendedSettings(file: File): Promise<TranscodeOptions> {
    const detectedCodec = this.codecDetector.getCodecFromFile(file);
    const bestCodec = await this.codecDetector.getBestCodec();
    const support = await this.codecDetector.detectSupport();

    // If file is already in optimal codec, minimal processing needed
    if (detectedCodec && detectedCodec.recommended && detectedCodec.name === bestCodec?.name) {
      return {
        targetCodec: detectedCodec.name as 'av1' | 'h264' | 'vp9',
        quality: 'medium',
        optimizeForWeb: true,
        createAdaptiveBitrate: false
      };
    }

    // Choose best codec based on browser support
    let targetCodec: 'av1' | 'h264' | 'vp9' = 'h264'; // fallback
    
    if (support.av1 && bestCodec?.name === 'AV1') {
      targetCodec = 'av1';
    } else if (support.vp9 && bestCodec?.name === 'VP9') {
      targetCodec = 'vp9';
    }

    // Adjust quality based on file size
    const quality = file.size > 100 * 1024 * 1024 ? 'medium' : 'high';

    return {
      targetCodec,
      quality,
      optimizeForWeb: true,
      createAdaptiveBitrate: support.webAssembly && file.size > 50 * 1024 * 1024
    };
  }

  // Batch process multiple files
  async processBatchUpload(
    files: File[],
    options: Partial<TranscodeOptions> = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const result = await this.processUpload(file, {
          ...options,
          // Update progress to include batch information
        });
        
        results.push(result);
        
        // Small delay between files to prevent browser overload
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
        // Continue with other files
      }
    }
    
    return results;
  }
}
