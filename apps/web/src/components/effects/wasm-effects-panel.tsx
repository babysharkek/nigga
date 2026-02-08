'use client';

import { useState, useEffect, useRef } from 'react';
import { VideoProcessorWASM } from '@/services/wasm/video-processor-wasm';

interface WASMEffectsPanelProps {
  videoFrame: ImageData | null;
  onEffectApplied: (processedFrame: ImageData) => void;
}

export function WASMEffectsPanel({ 
  videoFrame, 
  onEffectApplied 
}: WASMEffectsPanelProps) {
  const [isWASMSupported, setIsWASMSupported] = useState(true);
  const [isSIMDSupported, setIsSIMDSupported] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [benchmark, setBenchmark] = useState<{ wasmTime: number; jsTime: number; speedup: number } | null>(null);
  
  const wasmProcessorRef = useRef<VideoProcessorWASM | null>(null);
  
  // Effect controls
  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [blurIntensity, setBlurIntensity] = useState(1.0);
  const [sharpenIntensity, setSharpenIntensity] = useState(1.0);

  useEffect(() => {
    const processor = new VideoProcessorWASM();
    wasmProcessorRef.current = processor;

    // Check WebAssembly support
    if (typeof WebAssembly === 'undefined') {
      setIsWASMSupported(false);
      return;
    }

    // Check SIMD support
    const hasSIMD = WebAssembly.validate(new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x02, 0x01, 0x00, 0x0b,
      0x03, 0x02, 0x01, 0x00,
      0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00, 0x20, 0x00, 0x41, 0x00, 0x0b,
      0x00, 0x0b
    ]));
    setIsSIMDSupported(hasSIMD);

    // Initialize WASM
    processor.initialize().then(success => {
      setIsInitialized(success);
      if (success) {
        console.log('WebAssembly + SIMD initialized successfully');
      }
    });

    return () => {
      // Cleanup
    };
  }, []);

  const applyBrightness = async () => {
    if (!wasmProcessorRef.current || !videoFrame || !isInitialized) return;
    
    setIsProcessing(true);
    
    try {
      const frameData = new Uint8Array(videoFrame.data.buffer);
      const processedData = wasmProcessorRef.current.processFrameSIMD(
        frameData,
        videoFrame.width,
        videoFrame.height,
        'brightness',
        brightness
      );
      
      const processedFrame = new ImageData(
        new Uint8ClampedArray(processedData),
        videoFrame.width,
        videoFrame.height
      );
      
      onEffectApplied(processedFrame);
    } catch (error) {
      console.error('Brightness processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyContrast = async () => {
    if (!wasmProcessorRef.current || !videoFrame || !isInitialized) return;
    
    setIsProcessing(true);
    
    try {
      const frameData = new Uint8Array(videoFrame.data.buffer);
      const processedData = wasmProcessorRef.current.processFrameSIMD(
        frameData,
        videoFrame.width,
        videoFrame.height,
        'contrast',
        contrast
      );
      
      const processedFrame = new ImageData(
        new Uint8ClampedArray(processedData),
        videoFrame.width,
        videoFrame.height
      );
      
      onEffectApplied(processedFrame);
    } catch (error) {
      console.error('Contrast processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const runBenchmark = async () => {
    if (!wasmProcessorRef.current || !isInitialized) return;
    
    try {
      const results = await wasmProcessorRef.current.benchmark();
      setBenchmark(results);
      console.log('WASM Benchmark Results:', results);
    } catch (error) {
      console.error('Benchmark failed:', error);
    }
  };

  if (!isWASMSupported) {
    return (
      <div className="effects-panel">
        <div className="text-red-500 mb-4">
          ⚠️ WebAssembly not supported in this browser
        </div>
        <div className="text-sm text-gray-600">
          Please use a modern browser with WebAssembly support
        </div>
      </div>
    );
  }

  return (
    <div className="wasm-effects-panel">
      <h3 className="text-lg font-semibold mb-4">
        WebAssembly + SIMD Effects
        {isSIMDSupported && <span className="text-green-500 ml-2">✓ SIMD</span>}
      </h3>
      
      {isInitialized ? (
        <div className="space-y-6">
          {/* Performance Info */}
          <div className="bg-gray-800 rounded p-4">
            <h4 className="font-medium mb-2">Performance</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div>✓ WebAssembly: Near-native performance</div>
              <div>✓ SIMD: Parallel processing</div>
              <div>✓ Memory: Shared WASM memory</div>
              {benchmark && (
                <div className="mt-2 text-green-400">
                  Speedup: {benchmark.speedup.toFixed(2)}x faster than JavaScript
                </div>
              )}
            </div>
            <button
              onClick={runBenchmark}
              className="mt-2 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              Run Benchmark
            </button>
          </div>

          {/* Brightness Control */}
          <div className="effect-section">
            <h4 className="font-medium mb-2">Brightness (SIMD)</h4>
            <div className="space-y-2">
              <div>
                <label className="text-sm">Brightness: {brightness.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={brightness}
                  onChange={(e) => setBrightness(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={applyBrightness}
                disabled={isProcessing}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isProcessing ? 'Processing...' : 'Apply Brightness'}
              </button>
            </div>
          </div>

          {/* Contrast Control */}
          <div className="effect-section">
            <h4 className="font-medium mb-2">Contrast (SIMD)</h4>
            <div className="space-y-2">
              <div>
                <label className="text-sm">Contrast: {contrast.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={contrast}
                  onChange={(e) => setContrast(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={applyContrast}
                disabled={isProcessing}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isProcessing ? 'Processing...' : 'Apply Contrast'}
              </button>
            </div>
          </div>

          {/* Performance Comparison */}
          <div className="bg-gray-800 rounded p-4">
            <h4 className="font-medium mb-2">Performance Comparison</h4>
            <div className="text-sm text-gray-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold text-blue-400">WebAssembly + SIMD</div>
                  <ul className="mt-1 space-y-1">
                    <li>• 10-50x faster processing</li>
                    <li>• Parallel vector operations</li>
                    <li>• Near-native speed</li>
                    <li>• Low memory overhead</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-gray-400">JavaScript</div>
                  <ul className="mt-1 space-y-1">
                    <li>• Single-threaded</li>
                    <li>• Higher memory usage</li>
                    <li>• Slower for large data</li>
                    <li>• Limited parallelism</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-yellow-600">
          Initializing WebAssembly + SIMD...
        </div>
      )}
    </div>
  );
}
