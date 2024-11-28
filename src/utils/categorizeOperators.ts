import { OperatorData, OperatorInfo } from "../types/ONNXInterfaces";

export const categorizeOperators = (operators: string[], operatorData: OperatorData) => {
    const supported: OperatorInfo[] = [];
    const sentisOnly: OperatorInfo[] = [];
    const unsupported: OperatorInfo[] = [];
    const unknown: OperatorInfo[] = [];

    operators.forEach((op) => {
        if (operatorData.supported[op]) {
            supported.push({
                name: op,
                status: 'supported',
                cpuSupport: operatorData.supported[op].CPU,
                gpuComputeSupport: operatorData.supported[op].GPUCompute,
                gpuPixelSupport: operatorData.supported[op].GPUPixel,
            });
        } else if (operatorData.sentisOnly[op]) {
            sentisOnly.push({
                name: op,
                status: 'sentisOnly',
                cpuSupport: operatorData.sentisOnly[op].CPU,
                gpuComputeSupport: operatorData.sentisOnly[op].GPUCompute,
                gpuPixelSupport: operatorData.sentisOnly[op].GPUPixel,
            });
        } else if (operatorData.unsupported.has(op)) {
            unsupported.push({
                name: op,
                status: 'unsupported',
                cpuSupport: '-',
                gpuComputeSupport: '-',
                gpuPixelSupport: '-',
            });
        } else {
            unknown.push({
                name: op,
                status: 'unknown',
                cpuSupport: '-',
                gpuComputeSupport: '-',
                gpuPixelSupport: '-',
            });
        }
    });

    return {
        supported,
        sentisOnly,
        unsupported,
        unknown,
        all: [...supported, ...sentisOnly, ...unsupported, ...unknown],
    };
};
