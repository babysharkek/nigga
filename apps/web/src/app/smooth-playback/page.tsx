'use client';

import { useState } from 'react';
import { SmoothVideoPlayer } from '@/components/playback/smooth-video-player';

export default function SmoothPlaybackPage() {
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [bufferHealth, setBufferHealth] = useState<any>(null);

  const handlePerformanceMetrics = (metrics: any) => {
    setPerformanceMetrics(metrics);
  };

  const handleBufferHealth = (health: any) => {
    setBufferHealth(health);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🚀 Smooth Video Playback
          </h1>
          
          <div className="text-lg text-gray-300 mb-6">
            Advanced buffering strategy and hardware acceleration for buttery-smooth 60fps+ video playback
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-3">
                📊 Smart Buffering Strategy
              </h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Adaptive buffering based on network speed</li>
                <li>• Pre-load 10-30 seconds ahead</li>
                <li>• Memory-efficient buffer pools</li>
                <li>• Automatic buffer underrun recovery</li>
                <li>• Segment-based loading</li>
                <li>• Priority-based decoding</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-3">
                ⚡ Hardware Acceleration
              </h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• GPU-accelerated video decoding</li>
                <li>• Zero-copy texture uploads</li>
                <li>• Hardware-specific optimizations</li>
                <li>• Automatic fallback to software</li>
                <li>• Memory-mapped textures</li>
                <li>• Vendor-specific tuning</li>
              </ul>
            </div>
          </div>

          {/* Performance Benefits */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Performance Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">60fps+</div>
                <div className="text-gray-300 text-sm">Smooth Frame Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">0ms</div>
                <div className="text-gray-300 text-sm">Input Latency</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">100%</div>
                <div className="text-gray-300 text-sm">Buffer Health</div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            Smooth Video Player Demo
          </h3>
          
          <div className="relative bg-black rounded-lg overflow-hidden">
            <SmoothVideoPlayer
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              width={1280}
              height={720}
              autoPlay={false}
              muted={true}
              onBufferHealth={handleBufferHealth}
              onPerformanceMetrics={handlePerformanceMetrics}
            />
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            This demo showcases smooth video playback with advanced buffering and hardware acceleration.
            Notice the real-time performance metrics overlay.
          </div>
        </div>

        {/* Live Performance Metrics */}
        {(performanceMetrics || bufferHealth) && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Live Performance Metrics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {performanceMetrics && (
                <div>
                  <h4 className="font-semibold text-gray-300 mb-3">Playback Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current FPS:</span>
                      <span className="text-green-400 font-mono">{performanceMetrics.fps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hardware Decoding:</span>
                      <span className={performanceMetrics.hardwareCapabilities?.gpuAcceleration ? 'text-green-400' : 'text-red-400'}>
                        {performanceMetrics.hardwareCapabilities?.gpuAcceleration ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">GPU Vendor:</span>
                      <span className="text-blue-400">{performanceMetrics.hardwareCapabilities?.vendor || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {bufferHealth && (
                <div>
                  <h4 className="font-semibold text-gray-300 mb-3">Buffer Health</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Buffer Health:</span>
                      <span className="text-green-400 font-mono">{bufferHealth.bufferHealth.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Loaded Segments:</span>
                      <span className="text-blue-400 font-mono">{bufferHealth.loadedSegments}/{bufferHealth.totalSegments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Buffered Time:</span>
                      <span className="text-purple-400 font-mono">{bufferHealth.estimatedPlayTime.toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Memory Usage:</span>
                      <span className="text-yellow-400 font-mono">{(bufferHealth.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Technical Implementation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-300 mb-3">Buffering Strategy</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• 2-second video segments</li>
                <li>• 100MB maximum buffer size</li>
                <li>• Priority-based segment loading</li>
                <li>• Adaptive network speed detection</li>
                <li>• Memory pool recycling</li>
                <li>• Automatic old segment eviction</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-300 mb-3">Hardware Acceleration</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• WebCodecs API for decoding</li>
                <li>• GPU texture streaming</li>
                <li>• Zero-copy memory transfers</li>
                <li>• Vendor-specific optimizations</li>
                <li>• Automatic software fallback</li>
                <li>• Real-time performance monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
