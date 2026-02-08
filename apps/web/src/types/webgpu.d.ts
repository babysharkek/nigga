// WebGPU type definitions for TypeScript
declare global {
  interface Navigator {
    gpu?: GPU;
  }

  interface GPU {
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
  }

  interface GPUAdapter {
    requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
  }

  interface GPUDevice {
    createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
    createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout;
    createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
    createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
    createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout;
    createQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet;
    createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
    createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
    createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
    createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
    importExternalTexture(descriptor: GPUExternalTextureDescriptor): GPUTexture;
    queue: GPUQueue;
    lost: Promise<GPUDeviceLostInfo>;
  }

  interface GPURenderPipelineDescriptor {
    layout?: GPUPipelineLayoutDescriptor | 'auto';
    vertex?: GPUVertexState;
    fragment?: GPUFragmentState;
    primitive?: GPUPrimitiveState;
    depthStencil?: GPUDepthStencilState;
    multisample?: GPUMultisampleState;
    label?: string;
  }

  interface GPUCanvasContext {
    configure(descriptor: GPUCanvasConfiguration): void;
    getCurrentTexture(): GPUTexture;
    unconfigure(): void;
  }

  interface GPURenderPipeline {
    getBindGroupLayout(index: number): GPUBindGroupLayout;
  }

  interface GPUTexture {
    destroy(): void;
  }

  interface GPUBuffer {
    mapAsync(mode: GPUMapModeFlags, offset?: number, size?: number): Promise<void>;
    getMappedRange(offset?: number, size?: number): ArrayBuffer;
    unmap(): void;
    destroy(): void;
  }

  interface GPUQueue {
    writeBuffer(buffer: GPUBuffer, bufferOffset: number, data: ArrayBufferView, dataOffset?: number, size?: number): void;
    submit(commandBuffers: GPUCommandBuffer[]): void;
  }

  type GPUBufferUsageFlags = number;
  const GPUBufferUsage: {
    MAP_READ: number;
    MAP_WRITE: number;
    COPY_SRC: number;
    COPY_DST: number;
    INDEX: number;
    VERTEX: number;
    UNIFORM: number;
    STORAGE: number;
    INDIRECT: number;
    QUERY_RESOLVE: number;
  };

  type GPUTextureFormat = string;
  type GPUTextureUsageFlags = number;
}

export {};
