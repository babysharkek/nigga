'use client';

import { useState, useRef, useEffect } from 'react';
import { WebGPUEffects } from '@/services/renderer/webgpu-effects';

interface WebGPUEffectsPanelProps {
  videoFrame: VideoFrame | null;
  onEffectApplied: (processedFrame: GPUTexture) => void;
}

export function WebGPUEffectsPanel({ 
  videoFrame, 
  onEffectApplied 
}: WebGPUEffectsPanelProps) {
  const [isWebGPUSupported, setIsWebGPUSupported] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  
  const webgpuRef = useRef<WebGPUEffects | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Color grading controls
  const [gamma, setGamma] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [saturation, setSaturation] = useState(1.0);
  
  // Blur control
  const [blurRadius, setBlurRadius] = useState(5);
  
  // Green screen controls
  const [keyColor, setKeyColor] = useState<[number, number, number]>([0, 1, 0]);
  const [threshold, setThreshold] = useState(0.1);

  useEffect(() => {
    if (!canvasRef.current) return;

    const webgpu = new WebGPUEffects();
    webgpu.initialize(canvasRef.current).then(success => {
      if (success) {
        webgpuRef.current = webgpu;
        setIsInitialized(true);
        console.log('WebGPU initialized successfully');
      } else {
        setIsWebGPUSupported(false);
      }
    });

    return () => {
      // Cleanup WebGPU resources
    };
  }, []);

  const applyColorGrade = () => {
    if (!webgpuRef.current || !videoFrame) return;
    
    setActiveEffect('colorGrade');
    const texture = webgpuRef.current.applyColorGrade(videoFrame, gamma, contrast, saturation);
    if (texture) {
      onEffectApplied(texture);
    }
  };

  const applyBlur = () => {
    if (!webgpuRef.current || !videoFrame) return;
    
    setActiveEffect('blur');
    const texture = webgpuRef.current.applyBlur(videoFrame, blurRadius);
    if (texture) {
      onEffectApplied(texture);
    }
  };

  const applyGreenScreen = () => {
    if (!webgpuRef.current || !videoFrame) return;
    
    setActiveEffect('greenScreen');
    const texture = webgpuRef.current.applyGreenScreen(videoFrame, keyColor, threshold);
    if (texture) {
      onEffectApplied(texture);
    }
  };

  if (!isWebGPUSupported) {
    return (
      <div className="effects-panel">
        <div className="text-red-500 mb-4">
          ⚠️ WebGPU not supported in this browser
        </div>
        <div className="text-sm text-gray-600">
          Please use Chrome/Edge with WebGPU enabled for GPU-accelerated effects
        </div>
      </div>
    );
  }

  return (
    <div className="effects-panel">
      <h3 className="text-lg font-semibold mb-4">GPU-Accelerated Effects</h3>
      
      {isInitialized ? (
        <div className="space-y-6">
          {/* Color Grading */}
          <div className="effect-section">
            <h4 className="font-medium mb-2">Color Grading</h4>
            <div className="space-y-2">
              <div>
                <label className="text-sm">Gamma: {gamma.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={gamma}
                  onChange={(e) => setGamma(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm">Contrast: {contrast.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={contrast}
                  onChange={(e) => setContrast(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm">Saturation: {saturation.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={saturation}
                  onChange={(e) => setSaturation(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={applyColorGrade}
                disabled={activeEffect === 'colorGrade'}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                Apply Color Grade
              </button>
            </div>
          </div>

          {/* Blur Effect */}
          <div className="effect-section">
            <h4 className="font-medium mb-2">Gaussian Blur</h4>
            <div className="space-y-2">
              <div>
                <label className="text-sm">Blur Radius: {blurRadius}px</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={blurRadius}
                  onChange={(e) => setBlurRadius(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={applyBlur}
                disabled={activeEffect === 'blur'}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                Apply Blur
              </button>
            </div>
          </div>

          {/* Green Screen */}
          <div className="effect-section">
            <h4 className="font-medium mb-2">Green Screen (Chroma Key)</h4>
            <div className="space-y-2">
              <div>
                <label className="text-sm">Threshold: {threshold.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={applyGreenScreen}
                disabled={activeEffect === 'greenScreen'}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
              >
                Apply Green Screen
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="hidden"
          />
        </div>
      ) : (
        <div className="text-yellow-600">
          Initializing WebGPU...
        </div>
      )}
    </div>
  );
}
