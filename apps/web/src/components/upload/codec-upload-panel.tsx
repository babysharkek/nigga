'use client';

import { useState, useCallback } from 'react';
import { UploadPipeline, UploadProgress, UploadResult, TranscodeOptions } from '@/services/codec/upload-pipeline';
import { CodecDetector, CodecInfo } from '@/services/codec/codec-detector';

interface CodecUploadPanelProps {
  onUploadComplete?: (result: UploadResult) => void;
}

export function CodecUploadPanel({ onUploadComplete }: CodecUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [transcodeOptions, setTranscodeOptions] = useState<TranscodeOptions>({
    targetCodec: 'av1',
    quality: 'medium',
    optimizeForWeb: true,
    createAdaptiveBitrate: false,
    maxWidth: 1920,
    maxHeight: 1080
  });
  
  const [codecSupport, setCodecSupport] = useState<any>(null);
  const [bestCodec, setBestCodec] = useState<CodecInfo | null>(null);

  const uploadPipeline = new UploadPipeline();
  const codecDetector = CodecDetector.getInstance();

  // Initialize codec detection
  useState(() => {
    codecDetector.detectSupport().then(support => {
      setCodecSupport(support);
    });
    
    codecDetector.getBestCodec().then(codec => {
      setBestCodec(codec);
      if (codec) {
        setTranscodeOptions(prev => ({
          ...prev,
          targetCodec: codec.name.toLowerCase() as 'av1' | 'h264' | 'vp9'
        }));
      }
    });
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('video/')
    );
    
    setSelectedFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  }, []);

  const startProcessing = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    setProgress(null);
    
    uploadPipeline.setProgressCallback(setProgress);
    
    try {
      const uploadResults = await uploadPipeline.processBatchUpload(selectedFiles, transcodeOptions);
      setResults(uploadResults);
      
      if (onUploadComplete && uploadResults.length > 0) {
        uploadResults.forEach(result => {
          if (result.success) {
            onUploadComplete(result);
          }
        });
      }
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFiles, transcodeOptions, onUploadComplete]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCodecColor = (codec: string): string => {
    switch (codec) {
      case 'av1': return 'text-green-400';
      case 'h264': return 'text-blue-400';
      case 'vp9': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="codec-upload-panel">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Advanced Video Upload & Transcoding
        </h2>
        <p className="text-gray-400">
          Upload videos and automatically transcode to optimal codecs (AV1, H.264, VP9) using WebAssembly
        </p>
      </div>

      {/* Codec Support Status */}
      {codecSupport && (
        <div className="mb-6 bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Browser Codec Support</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className={codecSupport.av1 ? 'text-green-400' : 'text-red-400'}>
              AV1: {codecSupport.av1 ? '✓ Supported' : '✗ Not Supported'}
            </div>
            <div className={codecSupport.h264 ? 'text-green-400' : 'text-red-400'}>
              H.264: {codecSupport.h264 ? '✓ Supported' : '✗ Not Supported'}
            </div>
            <div className={codecSupport.vp9 ? 'text-green-400' : 'text-red-400'}>
              VP9: {codecSupport.vp9 ? '✓ Supported' : '✗ Not Supported'}
            </div>
            <div className={codecSupport.webAssembly ? 'text-green-400' : 'text-red-400'}>
              WebAssembly: {codecSupport.webAssembly ? '✓ Supported' : '✗ Not Supported'}
            </div>
          </div>
          {bestCodec && (
            <div className="mt-3 text-sm text-yellow-400">
              Recommended codec: {bestCodec.name} ({bestCodec.compression}% smaller files)
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-600 bg-gray-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
          disabled={isProcessing}
        />
        
        <label htmlFor="file-input" className="cursor-pointer">
          <div className="text-4xl mb-4">📹</div>
          <div className="text-white mb-2">
            Drag & drop video files here or click to browse
          </div>
          <div className="text-gray-400 text-sm">
            Supports MP4, WebM, MOV, AVI, MKV formats
          </div>
        </label>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">
            Selected Files ({selectedFiles.length})
          </h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-300">{file.name}</span>
                <span className="text-gray-500">{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcode Options */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Transcode Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Codec
              </label>
              <select
                value={transcodeOptions.targetCodec}
                onChange={(e) => setTranscodeOptions(prev => ({
                  ...prev,
                  targetCodec: e.target.value as 'av1' | 'h264' | 'vp9'
                }))}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                disabled={isProcessing}
              >
                <option value="av1">AV1 (Best Compression)</option>
                <option value="h264">H.264 (Universal Compatibility)</option>
                <option value="vp9">VP9 (Chrome/Edge Optimized)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quality
              </label>
              <select
                value={transcodeOptions.quality}
                onChange={(e) => setTranscodeOptions(prev => ({
                  ...prev,
                  quality: e.target.value as 'low' | 'medium' | 'high'
                }))}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                disabled={isProcessing}
              >
                <option value="low">Low (Faster, Smaller)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Better Quality)</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={transcodeOptions.optimizeForWeb}
                  onChange={(e) => setTranscodeOptions(prev => ({
                    ...prev,
                    optimizeForWeb: e.target.checked
                  }))}
                  className="mr-2"
                  disabled={isProcessing}
                />
                Optimize for web delivery (fast start, streaming ready)
              </label>
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={transcodeOptions.createAdaptiveBitrate}
                  onChange={(e) => setTranscodeOptions(prev => ({
                    ...prev,
                    createAdaptiveBitrate: e.target.checked
                  }))}
                  className="mr-2"
                  disabled={isProcessing}
                />
                Create adaptive bitrate versions (360p, 720p, 1080p)
              </label>
            </div>
          </div>
          
          <button
            onClick={startProcessing}
            disabled={isProcessing || selectedFiles.length === 0}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : `Process ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Processing Progress</h3>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">{progress.message}</span>
              <span className="text-gray-400">{progress.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Stage: {progress.stage}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Processing Results</h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border border-gray-700 rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-white font-medium">{result.originalFile.name}</div>
                    <div className={`text-sm ${getCodecColor(result.metadata.targetCodec)}`}>
                      {result.metadata.originalCodec} → {result.metadata.targetCodec.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-300">
                      {formatFileSize(result.stats.originalSize)} → {formatFileSize(result.stats.totalTranscodedSize)}
                    </div>
                    <div className="text-green-400">
                      {result.stats.sizeReduction.toFixed(1)}% smaller
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400">
                  <div>
                    <div className="text-gray-500">Compression Ratio</div>
                    <div>{result.stats.compressionRatio.toFixed(2)}x</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Processing Time</div>
                    <div>{(result.stats.processingTime / 1000).toFixed(1)}s</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Resolution</div>
                    <div>{result.metadata.resolution.width}x{result.metadata.resolution.height}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Output Files</div>
                    <div>{result.transcodedFiles.length}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
