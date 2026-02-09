'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { VideoThumbnailCache } from '@/services/renderer/video-thumbnail-cache';

interface TimelineTrack {
  id: string;
  type: 'video' | 'audio';
  name: string;
  url?: string;
  startTime: number;
  duration: number;
}

interface ThumbnailTimelineProps {
  width: number;
  height: number;
  tracks: TimelineTrack[];
  currentTime: number;
  onTimeChange: (time: number) => void;
}

export function ThumbnailTimeline({ 
  width, 
  height, 
  tracks, 
  currentTime, 
  onTimeChange
}: ThumbnailTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailCacheRef = useRef(new VideoThumbnailCache());
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState<Set<string>>(new Set());
  
  const trackHeight = 60;
  const trackPadding = 10;
  const pixelsPerSecond = 50;
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Generate thumbnails for video tracks
  useEffect(() => {
    const generateThumbnails = async () => {
      setIsLoading(true);
      const cache = thumbnailCacheRef.current;
      
      for (const track of tracks) {
        if (track.type === 'video' && track.url) {
          // Generate thumbnails every 2 seconds
          const thumbnailTimes = [];
          for (let t = 0; t < track.duration; t += 2) {
            thumbnailTimes.push(t);
          }
          
          // Preload thumbnails
          for (const time of thumbnailTimes) {
            try {
              const thumbnail = await cache.getThumbnail(track.url, time);
              if (thumbnail) {
                setThumbnailsLoaded(prev => new Set(prev).add(`${track.url}_${time}`));
              }
            } catch (error) {
              console.error('Failed to generate thumbnail:', error);
            }
          }
        }
      }
      
      setIsLoading(false);
    };

    generateThumbnails();
  }, [tracks]);

  // High-performance rendering loop
  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d')!;
    const cache = thumbnailCacheRef.current;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw tracks with thumbnails
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const y = i * (trackHeight + trackPadding) + 20;
      
      await drawTrackWithThumbnails(ctx, track, y, trackHeight, pixelsPerSecond, cache);
    }
    
    // Draw playhead
    drawPlayhead(ctx, currentTime, pixelsPerSecond, height);
    
    // Continue animation
    animationFrameRef.current = requestAnimationFrame(() => render());
  }, [tracks, currentTime, width, height]);

  // Start rendering loop
  useEffect(() => {
    render();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / pixelsPerSecond;
    onTimeChange(time);
  };

  return (
    <div className="thumbnail-timeline">
      <div className="timeline-controls mb-2 flex gap-2 items-center">
        <div className="text-sm text-green-400">
          {isLoading ? '🔄 Generating thumbnails...' : '✅ Thumbnails ready'}
        </div>
        <div className="text-sm text-gray-400">
          Loaded: {thumbnailsLoaded.size} thumbnails
        </div>
        <div className="text-sm text-gray-400">
          Time: {currentTime.toFixed(2)}s
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="timeline-canvas border border-gray-700 rounded cursor-crosshair"
        onClick={handleCanvasClick}
      />
      
      <div className="mt-2 text-xs text-gray-500">
        <div className="grid grid-cols-3 gap-4">
          <div>🎬 Video thumbnails displayed</div>
          <div>⚡ 60fps smooth rendering</div>
          <div>🗄️ Smart thumbnail caching</div>
        </div>
      </div>
    </div>
  );
}

async function drawTrackWithThumbnails(
  ctx: CanvasRenderingContext2D,
  track: TimelineTrack,
  y: number,
  height: number,
  pixelsPerSecond: number,
  thumbnailCache: VideoThumbnailCache
) {
  // Track background
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, y, ctx.canvas.width, height);
  
  // Track border
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, y, ctx.canvas.width, height);

  if (track.type === 'video' && track.url) {
    const startX = track.startTime * pixelsPerSecond;
    const trackWidth = track.duration * pixelsPerSecond;
    
    // Draw video thumbnails
    const thumbnailInterval = 2; // Every 2 seconds
    const thumbnailWidth = 80;
    
    for (let t = 0; t < track.duration; t += thumbnailInterval) {
      const thumbnailX = startX + (t * pixelsPerSecond);
      
      if (thumbnailX < ctx.canvas.width && thumbnailX + thumbnailWidth < ctx.canvas.width) {
        try {
          const thumbnail = await thumbnailCache.getThumbnail(track.url, t);
          
          if (thumbnail) {
            // Draw thumbnail
            ctx.drawImage(thumbnail, thumbnailX, y + 5, thumbnailWidth, height - 10);
            
            // Add border around thumbnail
            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = 1;
            ctx.strokeRect(thumbnailX, y + 5, thumbnailWidth, height - 10);
          } else {
            // Draw loading placeholder
            ctx.fillStyle = '#444';
            ctx.fillRect(thumbnailX, y + 5, thumbnailWidth, height - 10);
            ctx.fillStyle = '#666';
            ctx.font = '10px sans-serif';
            ctx.fillText('Loading...', thumbnailX + 20, y + 30);
          }
        } catch (error) {
          // Draw error placeholder
          ctx.fillStyle = '#844';
          ctx.fillRect(thumbnailX, y + 5, thumbnailWidth, height - 10);
          ctx.fillStyle = '#f66';
          ctx.font = '10px sans-serif';
          ctx.fillText('Error', thumbnailX + 25, y + 30);
        }
      }
    }
    
    // Draw track name
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(track.name, 10, y + 20);
    
    // Draw duration
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.fillText(`${track.duration.toFixed(1)}s`, 10, y + 35);
  }
  
  // Draw audio waveform
  if (track.type === 'audio') {
    const startX = track.startTime * pixelsPerSecond;
    const width = track.duration * pixelsPerSecond;
    
    ctx.fillStyle = '#4a9eff';
    ctx.fillRect(startX, y + height/2 - 10, width, 20);
    
    // Draw waveform pattern
    ctx.strokeStyle = '#6bb6ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let x = 0; x < width; x += 2) {
      const amplitude = Math.sin(x * 0.1) * 8;
      ctx.moveTo(startX + x, y + height/2);
      ctx.lineTo(startX + x, y + height/2 + amplitude);
    }
    ctx.stroke();
    
    // Draw track name
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(track.name, 10, y + 20);
    
    // Draw duration
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.fillText(`${track.duration.toFixed(1)}s`, 10, y + 35);
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.5;
  
  // Vertical lines (time markers)
  for (let x = 0; x < width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // Time labels
  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  for (let x = 0; x < width; x += 100) {
    const time = (x / 50).toFixed(0);
    ctx.fillText(`${time}s`, x + 2, 12);
  }
}

function drawPlayhead(ctx: CanvasRenderingContext2D, currentTime: number, pixelsPerSecond: number, height: number) {
  const x = currentTime * pixelsPerSecond;
  
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
  
  // Playhead triangle
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.moveTo(x - 5, 0);
  ctx.lineTo(x + 5, 0);
  ctx.lineTo(x, 0);
  ctx.closePath();
  ctx.fill();
}
