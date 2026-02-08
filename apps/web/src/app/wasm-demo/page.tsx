'use client';

import { useState, useEffect } from 'react';
import { WASMEffectsPanel } from '@/components/effects/wasm-effects-panel';
import { WASMTimeline } from '@/components/timeline/wasm-timeline';

// Demo data with pre-processed frames
const demoTracks = [
  {
    id: '1',
    type: 'video' as const,
    name: 'WASM Processed Video',
    startTime: 0,
    duration: 30,
    frames: [] // Would be populated with actual video frames
  },
  {
    id: '2',
    type: 'audio' as const,
    name: 'Audio Track',
    startTime: 0,
    duration: 30,
  },
];

export default function WASMDemoPage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [demoFrame, setDemoFrame] = useState<ImageData | null>(null);

  // Create demo frame for effects testing
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;
    
    // Create a colorful test pattern
    const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.33, '#00ff00');
    gradient.addColorStop(0.66, '#0000ff');
    gradient.addColorStop(1, '#ff00ff');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1920, 1080);
    
    // Add some test patterns
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.fillText('WebAssembly + SIMD Demo', 100, 100);
    
    // Create circles for testing effects
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * 1920,
        Math.random() * 1080,
        50 + Math.random() * 100,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
      ctx.fill();
    }
    
    const frameData = ctx.getImageData(0, 0, 1920, 1080);
    setDemoFrame(frameData);
  }, []);

  const handleEffectApplied = (processedFrame: ImageData) => {
    setDemoFrame(processedFrame);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">
          🚀 WebAssembly + SIMD Performance Demo
        </h1>
        
        <div className="mb-6 text-lg text-gray-300">
          Experience near-native video processing performance with WebAssembly and SIMD optimizations
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* WASM Effects Panel */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Real-time Effects Processing
            </h2>
            <WASMEffectsPanel 
              videoFrame={demoFrame}
              onEffectApplied={handleEffectApplied}
            />
          </div>

          {/* Demo Frame Display */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Processed Frame Preview
            </h2>
            {demoFrame && (
              <div className="relative">
                <canvas
                  ref={(canvas) => {
                    if (canvas && demoFrame) {
                      canvas.width = demoFrame.width;
                      canvas.height = demoFrame.height;
                      const ctx = canvas.getContext('2d')!;
                      ctx.putImageData(demoFrame, 0, 0);
                    }
                  }}
                  className="w-full h-auto rounded border border-gray-700"
                  style={{ maxHeight: '400px' }}
                />
                <div className="mt-2 text-sm text-gray-400">
                  Resolution: {demoFrame.width}x{demoFrame.height} | 
                  Size: {(demoFrame.data.length / 1024 / 1024).toFixed(2)}MB
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WASM Timeline */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            High-Performance Timeline
          </h2>
          <WASMTimeline
            width={1200}
            height={300}
            tracks={demoTracks}
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
          />
        </div>

        {/* Performance Comparison */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Performance Comparison
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded p-4">
              <h3 className="font-semibold text-green-400 mb-3">WebAssembly + SIMD</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• 10-50x faster processing</li>
                <li>• Parallel vector operations</li>
                <li>• Near-native speed</li>
                <li>• Low memory overhead</li>
                <li>• Hardware acceleration</li>
                <li>• Multi-threading support</li>
              </ul>
            </div>
            
            <div className="bg-gray-700 rounded p-4">
              <h3 className="font-semibold text-blue-400 mb-3">JavaScript</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Single-threaded</li>
                <li>• Higher memory usage</li>
                <li>• Slower for large data</li>
                <li>• Limited parallelism</li>
                <li>• No SIMD instructions</li>
                <li>• Interpreter overhead</li>
              </ul>
            </div>
            
            <div className="bg-gray-700 rounded p-4">
              <h3 className="font-semibold text-purple-400 mb-3">Use Cases</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Real-time video effects</li>
                <li>• 4K video processing</li>
                <li>• Color grading</li>
                <li>• Video scaling</li>
                <li>• Format conversion</li>
                <li>• Timeline rendering</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-900 rounded">
            <h3 className="font-semibold text-yellow-400 mb-2">Why WebAssembly + SIMD?</h3>
            <p className="text-sm text-gray-300">
              WebAssembly provides near-native performance by compiling to machine code, 
              while SIMD (Single Instruction, Multiple Data) allows processing multiple 
              data points simultaneously. This combination is perfect for video processing 
              where you need to apply the same operation to millions of pixels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
