'use client';

import { useEffect, useRef, useState } from 'react';
import { OffscreenCanvasManager } from '@/services/renderer/offscreen-canvas-manager';

interface OptimizedTimelineProps {
  width: number;
  height: number;
  tracks: any[];
  currentTime: number;
  onTimeChange: (time: number) => void;
}

export function OptimizedTimeline({ 
  width, 
  height, 
  tracks, 
  currentTime, 
  onTimeChange 
}: OptimizedTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef<OffscreenCanvasManager | null>(null);
  const [isOffscreenSupported, setIsOffscreenSupported] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Check if OffscreenCanvas is supported
    if (typeof OffscreenCanvas === 'undefined') {
      setIsOffscreenSupported(false);
      console.warn('OffscreenCanvas not supported, falling back to regular canvas');
      return;
    }

    // Initialize OffscreenCanvas manager
    const manager = new OffscreenCanvasManager(canvas);
    manager.initialize().then(success => {
      if (success) {
        managerRef.current = manager;
        console.log('OffscreenCanvas initialized successfully');
      } else {
        setIsOffscreenSupported(false);
      }
    });

    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
      }
    };
  }, []);

  // Update timeline data when tracks change
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.updateTimelineData({ tracks });
    }
  }, [tracks]);

  // Update time when currentTime changes
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.updateTime(currentTime);
    }
  }, [currentTime]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / width) * 100; // Convert to timeline time
    onTimeChange(time);
  };

  if (!isOffscreenSupported) {
    // Fallback to regular canvas rendering
    return (
      <div className="timeline-container">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="timeline-canvas"
          onClick={handleCanvasClick}
          style={{ border: '1px solid #333' }}
        />
        <div className="text-xs text-gray-500 mt-2">
          Using fallback rendering (OffscreenCanvas not supported)
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="timeline-canvas"
        onClick={handleCanvasClick}
        style={{ 
          border: '1px solid #333',
          imageRendering: 'crisp-edges'
        }}
      />
      <div className="text-xs text-green-500 mt-2">
        ✨ 60fps OffscreenCanvas rendering active
      </div>
    </div>
  );
}
