import { OptimizedTimelineDemo } from '@/components/timeline/optimized-timeline-demo';

export default function TimelineDemoPage() {
  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          OpenCut Timeline Performance Demo
        </h1>
        
        <OptimizedTimelineDemo />
        
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Performance Optimizations Implemented
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="bg-gray-700 rounded p-4">
              <h3 className="font-semibold text-blue-400 mb-2">🎯 Video Thumbnails</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• Cached thumbnails</li>
                <li>• Smart preloading</li>
                <li>• 160x90 resolution</li>
                <li>• Async generation</li>
              </ul>
            </div>
            
            <div className="bg-gray-700 rounded p-4">
              <h3 className="font-semibold text-green-400 mb-2">⚡ Rendering</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• 60fps target</li>
                <li>• RequestAnimationFrame</li>
                <li>• Canvas optimization</li>
                <li>• Minimal redraws</li>
              </ul>
            </div>
            
            <div className="bg-gray-700 rounded p-4">
              <h3 className="font-semibold text-purple-400 mb-2">🚀 Performance</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• Memory efficient</li>
                <li>• Lazy loading</li>
                <li>• Cache management</li>
                <li>• Smooth scrubbing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
