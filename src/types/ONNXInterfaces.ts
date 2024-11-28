export interface OpsetImport {
    version: number;
    domain?: string;
}

export interface NodeProto {
    opType: string;
}

export interface GraphProto {
    node: NodeProto[];
}

export interface ModelProto {
    opsetImport: OpsetImport[];
    producerName?: string;
    graph?: GraphProto;
}

export interface OutputItem {
    text: string;
    type: 'success' | 'warning' | 'error' | 'info' | 'default';
    category?: 'header' | 'detail';
}

export interface OperatorData {
    supported: {
        [key: string]: {
            CPU: string;
            GPUCompute: string;
            GPUPixel: string;
            Notes?: string;
        };
    };
    sentisOnly: {
        [key: string]: {
            CPU: string;
            GPUCompute: string;
            GPUPixel: string;
        };
    };
    unsupported: Set<string>;
}

export interface OperatorInfo {
    name: string;
    status: 'supported' | 'sentisOnly' | 'unsupported' | 'unknown';
    cpuSupport?: string;
    gpuComputeSupport?: string;
    gpuPixelSupport?: string;
}

export interface ValueInfoProto {
    name: string;
    type?: {
        tensorType?: {
            elemType: string; // float, int32, etc.
            shape?: {
                dim: { dimValue?: number; dimParam?: string }[];
            };
        };
    };
}

export interface GraphProto {
    node: NodeProto[];
    input: ValueInfoProto[];
    output: ValueInfoProto[];
}