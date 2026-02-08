'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoBufferManager, BufferHealth } from '@/services/playback/video-buffer-manager';
import { HardwareAcceleration, HardwareCapabilities } from '@/services/playback/hardware-acceleration';

interface SmoothVideoPlayerProps {
  src: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  muted?: boolean;
  onBufferHealth?: (health: BufferHealth) => void;
  onPerformanceMetrics?: (metrics: any) => void;
}

export function SmoothVideoPlayer({
  src,
  width = 1920,
  height = 1080,
  autoPlay = false,
  muted = false,
  onBufferHealth,
  onPerformanceMetrics
}: SmoothVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bufferHealth, setBufferHealth] = useState<BufferHealth | null>(null);
  const [hardwareCapabilities, setHardwareCapabilities] = useState<HardwareCapabilities | null>(null);
  
  const bufferManagerRef = useRef(new VideoBufferManager());
  const hardwareAccelerationRef = useRef(new HardwareAcceleration());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsRef = useRef<number>(0);

  // Initialize hardware acceleration and buffering
  useEffect(() => {
    const initializePlayback = async () => {
      // Detect hardware capabilities
      const capabilities = await hardwareAccelerationRef.current.detectCapabilities();
      setHardwareCapabilities(capabilities);
      
      // Initialize hardware-accelerated decoding
      await hardwareAccelerationRef.current.initializeDecoding('avc1.42E01E', width, height);
      
      // Set up buffer health monitoring
      bufferManagerRef.current.onBufferHealth((health) => {
        setBufferHealth(health);
        onBufferHealth?.(health);
      });
      
      // Start preloading
      if (src) {
        await bufferManagerRef.current.preloadAroundTime(0, src);
      }
    };

    initializePlayback();
  }, [src, width, height, onBufferHealth]);

  // Smooth rendering loop
  const render = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!video || !canvas || !ctx || video.paused || video.ended) {
      return;
    }

    // Calculate FPS
    const now = performance.now();
    frameCountRef.current++;
    
    if (now - lastFrameTimeRef.current >= 1000) {
      fpsRef.current = frameCountRef.current;
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
      
      // Report performance metrics
      onPerformanceMetrics?.({
        fps: fpsRef.current,
        bufferHealth,
        hardwareCapabilities
      });
    }

    // Render frame to canvas for smooth playback
    ctx.drawImage(video, 0, 0, width, height);
    
    // Continue rendering loop
    animationFrameRef.current = requestAnimationFrame(render);
  }, [width, height, bufferHealth, hardwareCapabilities, onPerformanceMetrics]);

  // Handle video events
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    render();
  }, [render]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Preload segments around current time
    bufferManagerRef.current.preloadAroundTime(video.currentTime, src);
    
    // Adaptive buffering based on playback position
    const networkSpeed = estimateNetworkSpeed();
    bufferManagerRef.current.adaptiveBuffering(networkSpeed, video.currentTime);
  }, [src]);

  const handleWaiting = useCallback(() => {
    // Buffer underrun - trigger emergency preload
    bufferManagerRef.current.onBufferUnderrun();
  }, []);

  // Network speed estimation
  const estimateNetworkSpeed = (): number => {
    // Simple network speed estimation based on buffer health
    if (!bufferHealth) return 5; // Default to 5 Mbps
    
    if (bufferHealth.bufferHealth > 80) return 10; // Fast
    if (bufferHealth.bufferHealth > 50) return 5;  // Medium
    if (bufferHealth.bufferHealth > 20) return 2;  // Slow
    return 1; // Very slow
  };

  // Manual seek handling
  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = time;
    
    // Clear buffer and preload around new position
    bufferManagerRef.current.clear();
    bufferManagerRef.current.preloadAroundTime(time, src);
  }, [src]);

  return (
    <div className="smooth-video-player">
      {/* Hidden video element for decoding */}
      <video
        ref={videoRef}
        src={src}
        width={width}
        height={height}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={handleWaiting}
        onSeeked={() => handleSeek(videoRef.current?.currentTime || 0)}
        style={{ display: 'none' }}
      />
      
      {/* Canvas for smooth rendering */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="video-canvas"
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: `${width}px`,
          background: '#000'
        }}
      />
      
      {/* Performance overlay */}
      <div className="performance-overlay absolute top-2 right-2 bg-black/75 text-white text-xs p-2 rounded">
        <div>FPS: {fpsRef.current}</div>
        <div>Buffer: {bufferHealth?.bufferHealth.toFixed(1)}%</div>
        <div>Decoding: {hardwareCapabilities?.videoDecoding}</div>
        <div>GPU: {hardwareCapabilities?.gpuAcceleration ? 'Yes' : 'No'}</div>
      </div>
      
      {/* Buffer health indicator */}
      {bufferHealth && (
        <div className="buffer-indicator absolute bottom-2 left-2 bg-black/75 text-white text-xs p-2 rounded">
          <div>Buffer Health</div>
          <div className="w-32 h-2 bg-gray-700 rounded-full mt-1">
            <div 
              className="h-2 bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${bufferHealth.bufferHealth}%` }}
            />
          </div>
          <div className="mt-1">
            {bufferHealth.estimatedPlayTime.toFixed(1)}s buffered
          </div>
        </div>
      )}
      
      {/* Hardware acceleration indicator */}
      {hardwareCapabilities && (
        <div className="hardware-indicator absolute top-2 left-2 bg-black/75 text-white text-xs p-2 rounded">
          <div className="flex items-center space-x-2">
            <div>Hardware:</div>
            <div className={hardwareCapabilities.gpuAcceleration ? 'text-green-400' : 'text-red-400'}>
              {hardwareCapabilities.gpuAcceleration ? '✓' : '✗'}
            </div>
          </div>
          <div className="text-gray-300">
            {hardwareCapabilities.vendor}
          </div>
        </div>
      )}
    </div>
  );
}
