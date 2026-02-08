'use client';

import { useState } from 'react';
import { PerformanceTimeline } from './performance-timeline';

// Demo data for testing
const demoTracks = [
  {
    id: '1',
    type: 'video' as const,
    name: 'Main Video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    startTime: 0,
    duration: 30,
  },
  {
    id: '2',
    type: 'audio' as const,
    name: 'Background Music',
    startTime: 5,
    duration: 25,
  },
  {
    id: '3',
    type: 'video' as const,
    name: 'Overlay Video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    startTime: 10,
    duration: 15,
  },
];

export function OptimizedTimelineDemo() {
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">
        High-Performance Timeline with Video Thumbnails
      </h2>
      
      <div className="mb-4 text-sm text-gray-400">
        <p>✨ Features:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Video thumbnails cached and displayed on timeline</li>
          <li>60fps rendering with requestAnimationFrame</li>
          <li>Smart thumbnail preloading</li>
          <li>Hover effects and track selection</li>
          <li>Real-time playhead movement</li>
        </ul>
      </div>

      <PerformanceTimeline
        width={1200}
        height={400}
        tracks={demoTracks}
        currentTime={currentTime}
        onTimeChange={setCurrentTime}
        onTrackSelect={setSelectedTrack}
      />
      
      <div className="mt-4 flex gap-4 text-sm">
        <div className="text-white">
          Current Time: <span className="text-blue-400">{currentTime.toFixed(2)}s</span>
        </div>
        {selectedTrack && (
          <div className="text-white">
            Selected Track: <span className="text-green-400">{selectedTrack}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Performance Tips:</p>
        <ul className="list-disc list-inside mt-1">
          <li>Thumbnails are cached to avoid regeneration</li>
          <li>Only visible thumbnails are rendered</li>
          <li>Uses OffscreenCanvas for smooth rendering</li>
          <li>Optimized for 60fps timeline scrubbing</li>
        </ul>
      </div>
    </div>
  );
}
