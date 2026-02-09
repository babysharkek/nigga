'use client';

import { useState } from 'react';
import { ThumbnailTimeline } from '@/components/timeline/thumbnail-timeline';

// Demo data with actual video URLs
const demoTracks = [
  {
    id: '1',
    type: 'video' as const,
    name: 'Big Buck Bunny',
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
    name: 'Elephants Dream',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    startTime: 10,
    duration: 15,
  },
];

export default function ThumbnailTimelinePage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">
          🎬 Video Thumbnail Timeline
        </h1>
        
        <div className="mb-6 text-lg text-gray-300">
          Timeline with actual video thumbnails - see what's in your video at any point!
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-green-400 mb-3">
              🎯 Video Thumbnails
            </h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• Real video frame previews</li>
              <li>• Generated every 2 seconds</li>
              <li>• Smart caching system</li>
              <li>• Async loading</li>
              <li>• Error handling</li>
              <li>• Loading indicators</li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-400 mb-3">
              ⚡ Performance
            </h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• 60fps smooth rendering</li>
              <li>• RequestAnimationFrame</li>
              <li>• Canvas optimization</li>
              <li>• Minimal redraws</li>
              <li>• Memory efficient</li>
              <li>• Lazy loading</li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-purple-400 mb-3">
              🎨 Visual Features
            </h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• Thumbnail borders</li>
              <li>• Loading states</li>
              <li>• Error indicators</li>
              <li>• Track info display</li>
              <li>• Duration labels</li>
              <li>• Hover effects</li>
            </ul>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Interactive Timeline with Thumbnails
          </h2>
          
          <ThumbnailTimeline
            width={1200}
            height={400}
            tracks={demoTracks}
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
          />
          
          <div className="mt-4 text-sm text-gray-400">
            <div className="flex gap-6">
              <span>Click on the timeline to scrub</span>
              <span>•</span>
              <span>Thumbnails show actual video frames</span>
              <span>•</span>
              <span>Blue borders indicate loaded thumbnails</span>
            </div>
          </div>
        </div>

        {/* Current Time Display */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            Timeline Controls
          </h3>
          
          <div className="flex items-center gap-6">
            <div className="text-white">
              Current Time: <span className="text-blue-400 font-mono">{currentTime.toFixed(2)}s</span>
            </div>
            
            <button
              onClick={() => setCurrentTime(0)}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Reset to Start
            </button>
            
            <button
              onClick={() => setCurrentTime(prev => Math.min(prev + 5, 30))}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              +5s
            </button>
            
            <button
              onClick={() => setCurrentTime(prev => Math.max(prev - 5, 0))}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              -5s
            </button>
          </div>
        </div>

        {/* Track Information */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Track Information
          </h3>
          
          <div className="space-y-4">
            {demoTracks.map((track, index) => (
              <div key={track.id} className="border border-gray-700 rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-medium">{track.name}</div>
                    <div className="text-gray-400 text-sm">
                      Type: {track.type.toUpperCase()} | 
                      Duration: {track.duration}s | 
                      Start: {track.startTime}s
                    </div>
                    {track.url && (
                      <div className="text-gray-500 text-xs mt-1">
                        Source: {track.url.split('/').pop()}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      track.type === 'video' ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {track.type === 'video' ? '🎬 Video' : '🎵 Audio'}
                    </div>
                    {track.type === 'video' && (
                      <div className="text-xs text-gray-400 mt-1">
                        Thumbnails: {Math.floor(track.duration / 2)} frames
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            Technical Implementation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-300 mb-3">Thumbnail Generation</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• HTML5 Video element for frame extraction</li>
                <li>• Canvas 2D context for frame capture</li>
                <li>• ImageBitmap for efficient storage</li>
                <li>• LRU cache with 100 frame limit</li>
                <li>• Async generation with error handling</li>
                <li>• 160x90px thumbnail resolution</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-300 mb-3">Rendering Pipeline</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• RequestAnimationFrame for 60fps</li>
                <li>• Canvas 2D rendering</li>
                <li>• Minimal redraws only when needed</li>
                <li>• Grid overlay for time markers</li>
                <li>• Real-time playhead tracking</li>
                <li>• Click-to-scrub interaction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
