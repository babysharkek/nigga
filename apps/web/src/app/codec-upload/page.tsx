'use client';

import { CodecUploadPanel } from '@/components/upload/codec-upload-panel';
import { UploadResult } from '@/services/codec/upload-pipeline';

export default function CodecUploadPage() {
  const handleUploadComplete = (result: UploadResult) => {
    console.log('Upload completed:', result);
    // In a real app, this would:
    // - Upload to cloud storage
    // - Update database
    // - Notify user
    // - Add to timeline
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🚀 Advanced Video Codec Processing
          </h1>
          
          <div className="text-lg text-gray-300 mb-6">
            Upload videos and automatically transcode to optimal codecs using WebAssembly + FFmpeg
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-3">
                🎯 Smart Codec Detection
              </h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Automatic codec detection</li>
                <li>• Browser capability analysis</li>
                <li>• Optimal codec selection</li>
                <li>• Quality vs size optimization</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-3">
                ⚡ WebAssembly Transcoding
              </h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Client-side processing</li>
                <li>• FFmpeg.wasm integration</li>
                <li>• No server upload needed</li>
                <li>• Real-time progress</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-purple-400 mb-3">
                📦 Modern Codec Support
              </h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• AV1 (30% smaller than H.265)</li>
                <li>• H.264 (universal compatibility)</li>
                <li>• VP9 (Chrome/Edge optimized)</li>
                <li>• Adaptive bitrate streaming</li>
              </ul>
            </div>
          </div>

          {/* Codec Comparison Table */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Codec Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-4 text-gray-400">Codec</th>
                    <th className="text-left py-2 px-4 text-gray-400">Compression</th>
                    <th className="text-left py-2 px-4 text-gray-400">Quality</th>
                    <th className="text-left py-2 px-4 text-gray-400">Browser Support</th>
                    <th className="text-left py-2 px-4 text-gray-400">Best For</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-700">
                    <td className="py-2 px-4 font-semibold text-green-400">AV1</td>
                    <td className="py-2 px-4">30% smaller than H.265</td>
                    <td className="py-2 px-4">Excellent</td>
                    <td className="py-2 px-4">Chrome, Edge, Firefox, Safari M3+</td>
                    <td className="py-2 px-4">Web delivery, streaming</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 px-4 font-semibold text-blue-400">H.264</td>
                    <td className="py-2 px-4">Baseline</td>
                    <td className="py-2 px-4">Good</td>
                    <td className="py-2 px-4">Universal</td>
                    <td className="py-2 px-4">Maximum compatibility</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 px-4 font-semibold text-purple-400">VP9</td>
                    <td className="py-2 px-4">20% smaller than H.264</td>
                    <td className="py-2 px-4">Very Good</td>
                    <td className="py-2 px-4">Chrome, Edge, Firefox</td>
                    <td className="py-2 px-4">Chrome/Edge platforms</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-semibold text-gray-400">H.265/HEVC</td>
                    <td className="py-2 px-4">25% smaller than H.264</td>
                    <td className="py-2 px-4">Very Good</td>
                    <td className="py-2 px-4">Safari M3+, limited elsewhere</td>
                    <td className="py-2 px-4">Apple ecosystem</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Processing Pipeline */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Processing Pipeline
            </h3>
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <div className="text-white font-medium">Upload</div>
                  <div className="text-gray-400 text-sm">File validation</div>
                </div>
              </div>
              
              <div className="text-gray-500">→</div>
              
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <div className="text-white font-medium">Detect</div>
                  <div className="text-gray-400 text-sm">Codec analysis</div>
                </div>
              </div>
              
              <div className="text-gray-500">→</div>
              
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <div className="text-white font-medium">Transcode</div>
                  <div className="text-gray-400 text-sm">WebAssembly + FFmpeg</div>
                </div>
              </div>
              
              <div className="text-gray-500">→</div>
              
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                  4
                </div>
                <div>
                  <div className="text-white font-medium">Optimize</div>
                  <div className="text-gray-400 text-sm">Web delivery ready</div>
                </div>
              </div>
              
              <div className="text-gray-500">→</div>
              
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                  5
                </div>
                <div>
                  <div className="text-white font-medium">Store</div>
                  <div className="text-gray-400 text-sm">Cloud storage</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Component */}
        <CodecUploadPanel onUploadComplete={handleUploadComplete} />
      </div>
    </div>
  );
}
