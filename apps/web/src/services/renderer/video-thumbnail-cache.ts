// Video thumbnail cache for timeline performance
export class VideoThumbnailCache {
  private cache = new Map<string, ImageBitmap>();
  private generating = new Map<string, Promise<ImageBitmap>>();
  private maxCacheSize = 100;
  
  async getThumbnail(videoUrl: string, time: number): Promise<ImageBitmap | null> {
    const key = `${videoUrl}_${time}`;
    
    // Return from cache if available
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    // Check if already being generated
    if (this.generating.has(key)) {
      return this.generating.get(key)!;
    }
    
    // Generate thumbnail
    const promise = this.generateThumbnail(videoUrl, time);
    this.generating.set(key, promise);
    
    try {
      const thumbnail = await promise;
      
      // Cache the result
      if (this.cache.size >= this.maxCacheSize) {
        // Remove oldest entry
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }
      
      this.cache.set(key, thumbnail);
      return thumbnail;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    } finally {
      this.generating.delete(key);
    }
  }
  
  private async generateThumbnail(videoUrl: string, time: number): Promise<ImageBitmap> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      video.src = videoUrl;
      video.currentTime = time;
      
      video.onseeked = () => {
        canvas.width = 160; // Thumbnail width
        canvas.height = 90; // Thumbnail height (16:9)
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to ImageBitmap
        createImageBitmap(canvas).then(resolve).catch(reject);
      };
      
      video.onerror = reject;
    });
  }
  
  clearCache() {
    this.cache.clear();
    this.generating.clear();
  }
  
  preloadThumbnails(videoUrl: string, times: number[]) {
    times.forEach(time => {
      this.getThumbnail(videoUrl, time);
    });
  }
}
