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
  thumbnails?: string[];
}

interface PerformanceTimelineProps {
  width: number;
  height: number;
  tracks: TimelineTrack[];
  currentTime: number;
  onTimeChange: (time: number) => void;
  onTrackSelect: (trackId: string) => void;
}

export function PerformanceTimeline({ 
  width, 
  height, 
  tracks, 
  currentTime, 
  onTimeChange,
  onTrackSelect
}: PerformanceTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailCacheRef = useRef(new VideoThumbnailCache());
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameRef = useRef<number>();
  
  const trackHeight = 60;
  const trackPadding = 10;
  const pixelsPerSecond = 50;
  
  // Preload thumbnails for visible tracks
  useEffect(() => {
    const cache = thumbnailCacheRef.current;
    
    tracks.forEach(track => {
      if (track.type === 'video' && track.url) {
        // Preload thumbnails every 2 seconds
        const thumbnailTimes = [];
        for (let t = 0; t < track.duration; t += 2) {
          thumbnailTimes.push(t);
        }
        cache.preloadThumbnails(track.url, thumbnailTimes);
      }
    });
  }, [tracks]);
  
  // High-performance rendering loop
  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d')!;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw tracks
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const y = i * (trackHeight + trackPadding) + 20;
      
      await drawTrack(ctx, track, y, trackHeight, pixelsPerSecond, thumbnailCacheRef.current);
    }
    
    // Draw playhead
    drawPlayhead(ctx, currentTime, pixelsPerSecond, height);
    
    // Continue animation if playing
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(() => render());
    }
  }, [tracks, currentTime, width, height, isPlaying]);
  
  // Render on changes
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
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find which track is hovered
    const trackIndex = Math.floor((y - 20) / (trackHeight + trackPadding));
    if (trackIndex >= 0 && trackIndex < tracks.length) {
      setHoveredTrack(tracks[trackIndex].id);
    } else {
      setHoveredTrack(null);
    }
  };
  
  return (
    <div className="performance-timeline">
      <div className="timeline-controls mb-2 flex gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={() => thumbnailCacheRef.current.clearCache()}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          Clear Cache
        </button>
        <span className="text-sm text-gray-500">
          Time: {currentTime.toFixed(2)}s
        </span>
      </div>
      
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="timeline-canvas border border-gray-700 rounded cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredTrack(null)}
      />
      
      {hoveredTrack && (
        <div className="text-xs text-gray-400 mt-1">
          Hovered: {tracks.find(t => t.id === hoveredTrack)?.name}
        </div>
      )}
    </div>
  );
}

async function drawTrack(
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
  
  // Draw video content
  if (track.type === 'video' && track.url) {
    const startX = track.startTime * pixelsPerSecond;
    const width = track.duration * pixelsPerSecond;
    
    // Draw video thumbnails
    const thumbnailInterval = 2; // Every 2 seconds
    for (let t = 0; t < track.duration; t += thumbnailInterval) {
      const thumbnailX = startX + (t * pixelsPerSecond);
      
      if (thumbnailX < ctx.canvas.width && thumbnailX + 80 < ctx.canvas.width) {
        const thumbnail = await thumbnailCache.getThumbnail(track.url, t);
        
        if (thumbnail) {
          ctx.drawImage(thumbnail, thumbnailX, y + 5, 80, 45);
        } else {
          // Placeholder while loading
          ctx.fillStyle = '#444';
          ctx.fillRect(thumbnailX, y + 5, 80, 45);
          ctx.fillStyle = '#666';
          ctx.font = '10px sans-serif';
          ctx.fillText('Loading...', thumbnailX + 20, y + 30);
        }
      }
    }
    
    // Draw track name
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(track.name, 10, y + 20);
  }
  
  // Draw audio waveform (simplified)
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
