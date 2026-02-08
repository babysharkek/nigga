// Advanced video buffering strategy for smooth playback
export interface BufferSegment {
  id: string;
  startTime: number;
  endTime: number;
  data: ArrayBuffer;
  size: number;
  isLoaded: boolean;
  isDecoded: boolean;
  priority: number;
}

export interface BufferHealth {
  totalSegments: number;
  loadedSegments: number;
  decodedSegments: number;
  bufferHealth: number; // 0-100
  estimatedPlayTime: number; // seconds of buffered content
  memoryUsage: number; // bytes
}

export class VideoBufferManager {
  private segments = new Map<string, BufferSegment>();
  private bufferPool: ArrayBuffer[] = [];
  private maxBufferSize = 100 * 1024 * 1024; // 100MB
  private currentMemoryUsage = 0;
  private segmentDuration = 2; // 2-second segments
  private maxSegmentsAhead = 10; // Buffer 20 seconds ahead
  private decodeQueue: BufferSegment[] = [];
  private isDecoding = false;
  
  // Performance metrics
  private bufferHealthCallbacks: ((health: BufferHealth) => void)[] = [];
  private frameDropCount = 0;
  private bufferUnderrunCount = 0;
  private lastBufferHealthUpdate = 0;

  constructor() {
    this.initializeBufferPool();
  }

  // Initialize buffer pool for memory efficiency
  private initializeBufferPool() {
    const poolSize = 20; // Pre-allocate 20 buffers
    for (let i = 0; i < poolSize; i++) {
      this.bufferPool.push(new ArrayBuffer(2 * 1024 * 1024)); // 2MB buffers
    }
  }

  // Add video segment to buffer
  addSegment(
    startTime: number,
    endTime: number,
    data: ArrayBuffer,
    priority: number = 1
  ): string {
    const segmentId = `segment_${startTime}_${endTime}`;
    
    // Check memory constraints
    if (this.currentMemoryUsage + data.byteLength > this.maxBufferSize) {
      this.evictOldSegments();
    }

    const segment: BufferSegment = {
      id: segmentId,
      startTime,
      endTime,
      data,
      size: data.byteLength,
      isLoaded: true,
      isDecoded: false,
      priority
    };

    this.segments.set(segmentId, segment);
    this.currentMemoryUsage += data.byteLength;
    
    // Add to decode queue
    this.decodeQueue.push(segment);
    this.decodeQueue.sort((a, b) => b.priority - a.priority);
    
    this.startDecoding();
    this.updateBufferHealth();
    
    return segmentId;
  }

  // Get decoded segment for playback
  getSegment(time: number): BufferSegment | null {
    for (const segment of this.segments.values()) {
      if (time >= segment.startTime && time <= segment.endTime && segment.isDecoded) {
        return segment;
      }
    }
    return null;
  }

  // Preload segments around current time
  async preloadAroundTime(currentTime: number, videoUrl: string): Promise<void> {
    const segmentsToLoad = this.calculateSegmentsToLoad(currentTime);
    
    const loadPromises = segmentsToLoad.map(async (segmentTime) => {
      const segmentId = `segment_${segmentTime}`;
      
      if (!this.segments.has(segmentId)) {
        try {
          const segmentData = await this.fetchSegment(videoUrl, segmentTime, this.segmentDuration);
          this.addSegment(
            segmentTime,
            segmentTime + this.segmentDuration,
            segmentData,
            this.calculatePriority(segmentTime, currentTime)
          );
        } catch (error) {
          console.error(`Failed to preload segment at ${segmentTime}:`, error);
        }
      }
    });

    await Promise.allSettled(loadPromises);
  }

  // Adaptive buffering based on network conditions
  adaptiveBuffering(networkSpeed: number, currentTime: number): void {
    // Adjust buffer size based on network speed
    if (networkSpeed < 1) { // Slow network
      this.maxSegmentsAhead = 15; // Buffer 30 seconds
    } else if (networkSpeed < 5) { // Medium network
      this.maxSegmentsAhead = 10; // Buffer 20 seconds
    } else { // Fast network
      this.maxSegmentsAhead = 5; // Buffer 10 seconds
    }

    // Trigger preload with new settings
    this.preloadAroundTime(currentTime, '');
  }

  // Start background decoding
  private async startDecoding(): Promise<void> {
    if (this.isDecoding || this.decodeQueue.length === 0) {
      return;
    }

    this.isDecoding = true;

    while (this.decodeQueue.length > 0) {
      const segment = this.decodeQueue.shift()!;
      
      try {
        await this.decodeSegment(segment);
        segment.isDecoded = true;
      } catch (error) {
        console.error(`Failed to decode segment ${segment.id}:`, error);
      }
    }

    this.isDecoding = false;
    this.updateBufferHealth();
  }

  // Decode video segment using WebCodecs
  private async decodeSegment(segment: BufferSegment): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('VideoDecoder' in window)) {
        reject(new Error('VideoDecoder not supported'));
        return;
      }

      const decoder = new VideoDecoder({
        output: (frame) => {
          // Store decoded frame in GPU memory if possible
          this.storeDecodedFrame(segment.id, frame);
        },
        error: (error) => {
          reject(error);
        }
      });

      // Configure decoder based on video format
      decoder.configure({
        codec: 'avc1.42E01E', // H.264 baseline
        hardwareAcceleration: 'prefer-hardware' as const
      });

      // Create encoded chunk from segment data
      const chunk = new EncodedVideoChunk({
        type: 'key',
        timestamp: segment.startTime * 1000000, // Convert to microseconds
        data: new Uint8Array(segment.data)
      });

      decoder.decode(chunk);
      decoder.flush();
      decoder.close();
      
      resolve();
    });
  }

  // Store decoded frame in GPU memory
  private storeDecodedFrame(segmentId: string, frame: VideoFrame): void {
    if ('createImageBitmap' in window) {
      // Create GPU texture from frame
      createImageBitmap(frame).then(bitmap => {
        // Store in GPU memory pool
        this.storeInGPUPool(segmentId, bitmap);
        frame.close();
      });
    }
  }

  // Calculate which segments to load
  private calculateSegmentsToLoad(currentTime: number): number[] {
    const segmentsToLoad: number[] = [];
    
    for (let i = 0; i < this.maxSegmentsAhead; i++) {
      const segmentTime = Math.floor(currentTime) + (i * this.segmentDuration);
      const segmentId = `segment_${segmentTime}`;
      
      if (!this.segments.has(segmentId)) {
        segmentsToLoad.push(segmentTime);
      }
    }
    
    return segmentsToLoad;
  }

  // Calculate segment priority
  private calculatePriority(segmentTime: number, currentTime: number): number {
    const distance = Math.abs(segmentTime - currentTime);
    
    if (distance < 2) return 10; // High priority for immediate segments
    if (distance < 5) return 7;  // Medium priority
    if (distance < 10) return 4;  // Low priority
    return 1; // Very low priority
  }

  // Evict old segments to free memory
  private evictOldSegments(): void {
    const segmentsToEvict: BufferSegment[] = [];
    
    for (const segment of this.segments.values()) {
      // Keep segments that are recent or high priority
      const age = Date.now() - segment.startTime * 1000;
      if (age > 60000 && segment.priority < 5) { // Older than 1 minute and low priority
        segmentsToEvict.push(segment);
      }
    }

    // Sort by priority (evict low priority first)
    segmentsToEvict.sort((a, b) => a.priority - b.priority);

    for (const segment of segmentsToEvict) {
      if (this.currentMemoryUsage - segment.size < this.maxBufferSize * 0.8) {
        this.segments.delete(segment.id);
        this.currentMemoryUsage -= segment.size;
        
        // Return buffer to pool
        this.returnToPool(segment.data);
      } else {
        break; // Stop when memory target reached
      }
    }
  }

  // Fetch video segment
  private async fetchSegment(url: string, startTime: number, duration: number): Promise<ArrayBuffer> {
    const response = await fetch(`${url}?start=${startTime}&end=${startTime + duration}`, {
      headers: {
        'Range': `bytes=${startTime * 1000000}-${(startTime + duration) * 1000000}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch segment: ${response.statusText}`);
    }
    
    return response.arrayBuffer();
  }

  // Return buffer to pool
  private returnToPool(buffer: ArrayBuffer): void {
    if (this.bufferPool.length < 50) { // Max pool size
      this.bufferPool.push(buffer);
    }
  }

  // Get buffer from pool
  private getFromPool(): ArrayBuffer {
    return this.bufferPool.pop() || new ArrayBuffer(2 * 1024 * 1024);
  }

  // Store in GPU pool (simplified)
  private storeInGPUPool(segmentId: string, bitmap: ImageBitmap): void {
    // In a real implementation, this would use WebGPU or WebGL textures
    // For now, just store reference
    (bitmap as any).segmentId = segmentId;
  }

  // Update buffer health metrics
  private updateBufferHealth(): void {
    const now = Date.now();
    if (now - this.lastBufferHealthUpdate < 100) return; // Throttle updates
    
    const totalSegments = this.segments.size;
    const loadedSegments = Array.from(this.segments.values()).filter(s => s.isLoaded).length;
    const decodedSegments = Array.from(this.segments.values()).filter(s => s.isDecoded).length;
    
    const bufferHealth = totalSegments > 0 ? (decodedSegments / totalSegments) * 100 : 0;
    
    // Calculate estimated play time from decoded segments
    const decodedSegmentsArray = Array.from(this.segments.values()).filter(s => s.isDecoded);
    const estimatedPlayTime = decodedSegmentsArray.reduce((total, segment) => {
      return total + (segment.endTime - segment.startTime);
    }, 0);

    const health: BufferHealth = {
      totalSegments,
      loadedSegments,
      decodedSegments,
      bufferHealth,
      estimatedPlayTime,
      memoryUsage: this.currentMemoryUsage
    };

    // Notify callbacks
    this.bufferHealthCallbacks.forEach(callback => callback(health));
    this.lastBufferHealthUpdate = now;
  }

  // Subscribe to buffer health updates
  onBufferHealth(callback: (health: BufferHealth) => void): () => void {
    this.bufferHealthCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.bufferHealthCallbacks.indexOf(callback);
      if (index > -1) {
        this.bufferHealthCallbacks.splice(index, 1);
      }
    };
  }

  // Handle buffer underrun
  onBufferUnderrun(): void {
    this.bufferUnderrunCount++;
    console.warn(`Buffer underrun #${this.bufferUnderrunCount}`);
    
    // Trigger emergency preload
    this.preloadAroundTime(0, '');
  }

  // Handle frame drops
  onFrameDrop(): void {
    this.frameDropCount++;
    console.warn(`Frame drop #${this.frameDropCount}`);
    
    // Reduce quality or increase buffer size
    if (this.frameDropCount > 5) {
      this.maxSegmentsAhead = Math.min(this.maxSegmentsAhead + 2, 20);
    }
  }

  // Get performance metrics
  getMetrics(): {
    bufferHealth: BufferHealth;
    frameDrops: number;
    bufferUnderruns: number;
    memoryUsage: number;
  } {
    const segments = Array.from(this.segments.values());
    const decodedSegments = segments.filter(s => s.isDecoded);
    const estimatedPlayTime = decodedSegments.reduce((total, segment) => {
      return total + (segment.endTime - segment.startTime);
    }, 0);

    return {
      bufferHealth: {
        totalSegments: segments.length,
        loadedSegments: segments.filter(s => s.isLoaded).length,
        decodedSegments: decodedSegments.length,
        bufferHealth: segments.length > 0 ? (decodedSegments.length / segments.length) * 100 : 0,
        estimatedPlayTime,
        memoryUsage: this.currentMemoryUsage
      },
      frameDrops: this.frameDropCount,
      bufferUnderruns: this.bufferUnderrunCount,
      memoryUsage: this.currentMemoryUsage
    };
  }

  // Clear all buffers
  clear(): void {
    this.segments.clear();
    this.decodeQueue = [];
    this.currentMemoryUsage = 0;
    this.frameDropCount = 0;
    this.bufferUnderrunCount = 0;
  }
}
