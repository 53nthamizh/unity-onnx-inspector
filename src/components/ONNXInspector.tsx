import React, {useState, useRef, useEffect} from 'react';
import * as XLSX from 'xlsx';
import protobuf from "protobufjs";
import fs from "fs";

interface OpsetImport {
    version: number;
    domain?: string;
}

interface NodeProto {
    opType: string;
    // Add more fields if necessary
}

interface GraphProto {
    node: NodeProto[];
    // Add other relevant properties if needed
}

interface ModelProto {
    opsetImport: OpsetImport[];
    producerName?: string;
    graph?: GraphProto;
    // Add other relevant properties if necessary
}

interface OutputItem {
    text: string;
    type: 'success' | 'warning' | 'error' | 'info' | 'default';
    category?: 'header' | 'detail';
}

interface OperatorData {
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

interface OperatorInfo {
    name: string;
    status: 'supported' | 'sentisOnly' | 'unsupported' | 'unknown';
    cpuSupport?: string;
    gpuComputeSupport?: string;
    gpuPixelSupport?: string;
}


const ONNXInspector: React.FC = () => {
    const [versions, setVersions] = useState<{ label: string; file: string }[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const [output, setOutput] = useState<OutputItem[]>([]);
    const [urlInput, setUrlInput] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [operatorDataLoaded, setOperatorDataLoaded] = useState(false);
    const [modelStats, setModelStats] = useState<{
        supportedCount: number;
        sentisOnlyCount: number;
        unsupportedCount: number;
        unknownCount: number;
    }>({
        supportedCount: 0,
        sentisOnlyCount: 0,
        unsupportedCount: 0,
        unknownCount: 0
    });
    const [operatorData, setOperatorData] = useState<OperatorData>({
        supported: {},
        sentisOnly: {},
        unsupported: new Set()
    });
    const [operatorList, setOperatorList] = useState<OperatorInfo[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const operatorFileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const addOutput = (text: string, type: OutputItem['type'] = 'default', category?: 'header' | 'detail') => {
        setOutput(prev => [...prev, { text, type, category }]);
    };

    const clearOutput = () => {
        setOutput([]);
        setModelStats({
            supportedCount: 0,
            sentisOnlyCount: 0,
            unsupportedCount: 0,
            unknownCount: 0,
        });
        setOperatorList([]); // Clear the operator list
    };

    const fetchVersions = async () => {
        try {
            // Fetch the file list JSON from the public folder
            const response = await fetch('/assets/xlsx/fileList.json');
            if (!response.ok) throw new Error('Failed to fetch file list.');

            const files = await response.json(); // Example: ["version1.xlsx", "version2.xlsx", "version3.xlsx"]
            const versionOptions = files.map((file: string) => ({
                label: file.replace('.xlsx', ''), // Use file name without extension as label
                file: `/assets/xlsx/${file}`, // Full path for the file
            }));

            setVersions(versionOptions);
            setSelectedVersion(versionOptions[0]?.file || ''); // Default to the first version
        } catch (error) {
            setOutput((prev) => [
                ...prev,
                { text: `Error fetching versions: ${(error as Error).message}`, type: 'error' },
            ]);
            console.error(error);
        }
    };


    const handleVersionChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedFile = event.target.value;
        setSelectedVersion(selectedFile);

        try {
            console.log('Loading operator data for file:', selectedFile);
            setIsProcessing(true);

            const response = await fetch(selectedFile);
            if (!response.ok) throw new Error(`Failed to fetch the file: ${selectedFile}`);

            const arrayBuffer = await response.arrayBuffer();
            const file = new Blob([arrayBuffer]);
            console.log('Fetched file successfully:', selectedFile);

            await loadOperatorData(file);
        } catch (error) {
            addOutput(`Error loading file: ${(error as Error).message}`, 'error');
            console.error('Error loading operator data:', error);
        } finally {
            setIsProcessing(false);
        }
    };



    useEffect(() => {
        fetchVersions();
    }, []);

    const loadOperatorData = async (file: Blob) => {
        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer);

            const supported: OperatorData['supported'] = {};
            const sentisOnly: OperatorData['sentisOnly'] = {};
            const unsupported = new Set<string>();

            // Parse sheets
            try {
                const supportedSheet = workbook.Sheets["Supported ONNX operators"];
                const supportedData = XLSX.utils.sheet_to_json<any>(supportedSheet, { header: 1 });

                supportedData.slice(1).forEach((row: any[]) => {
                    const operator = row[0]?.trim(); // Column A (Operator Name)
                    const cpu = row[1]?.trim() || '-'; // Column B (BackendType.CPU)
                    const gpuCompute = row[2]?.trim() || '-'; // Column C (BackendType.GPUCompute)
                    const gpuPixel = row[3]?.trim() || '-'; // Column D (BackendType.GPUPixel)

                    if (!operator) return; // Skip if operator name is missing

                    supported[operator] = {
                        CPU: cpu,
                        GPUCompute: gpuCompute,
                        GPUPixel: gpuPixel,
                    };
                });
            } catch (e) {
                addOutput('Warning: Error parsing supported operators sheet', 'warning');
                console.error(e);
            }

            try {
                const sentisSheet = workbook.Sheets["Sentis only layers"];
                const sentisData = XLSX.utils.sheet_to_json<any>(sentisSheet, { header: 1 });

                sentisData.slice(1).forEach((row: any[]) => {
                    const operator = row[0]?.trim(); // Column A (Operator Name)
                    if (!operator) return;

                    sentisOnly[operator] = {
                        CPU: row[1]?.trim() || '-', // Column B (BackendType.CPU)
                        GPUCompute: row[2]?.trim() || '-', // Column C (BackendType.GPUCompute)
                        GPUPixel: row[3]?.trim() || '-', // Column D (BackendType.GPUPixel)
                    };
                });
            } catch (e) {
                addOutput('Warning: Error parsing Sentis-only operators sheet', 'warning');
            }

            try {
                const unsupportedSheet = workbook.Sheets["Unsupported Operators"];
                const unsupportedData = XLSX.utils.sheet_to_json<any>(unsupportedSheet, { header: 1 });

                unsupportedData.slice(1).forEach((row: any[]) => {
                    const operator = row[0]?.trim(); // Column A (Operator Name)
                    if (operator) unsupported.add(operator);
                });
            } catch (e) {
                addOutput('Warning: Error parsing unsupported operators sheet', 'warning');
            }

            setOperatorData({ supported, sentisOnly, unsupported });
            setOperatorDataLoaded(true);
            addOutput('✓ Operator data loaded successfully', 'success', 'header');
            addOutput(`Found ${Object.keys(supported).length} supported operators`, 'info');
            addOutput(`Found ${Object.keys(sentisOnly).length} Sentis-only operators`, 'info');
            addOutput(`Found ${unsupported.size} unsupported operators`, 'info');
        } catch (error) {
            addOutput('❌ Failed to load operator data', 'error', 'header');
            addOutput(`Error details: ${(error as Error).message}`, 'error', 'detail');
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const parseONNXModel = async (arrayBuffer: ArrayBuffer) => {
        if (!operatorDataLoaded) {
            addOutput('⚠️ Please load operator data first', 'warning', 'header');
            return;
        }

        // Clear the output and table before processing the new model
        clearOutput();

        setIsProcessing(true);
        try {
            const root = await protobuf.load("onnx.proto3"); // Ensure the proto file is accessible
            const ModelProto = root.lookupType("onnx.ModelProto");

            // Decode the model and cast it to the defined interface
            const model = ModelProto.decode(new Uint8Array(arrayBuffer)) as unknown as ModelProto;

            // Extract metadata
            const opsetImports = model.opsetImport || [];
            const opsetVersion = opsetImports.length > 0 ? opsetImports[0].version : 'Unknown';
            const producerName = model.producerName || 'Unknown';

            addOutput('🔍 Model Analysis Results', 'info', 'header');
            addOutput(`Model format: Valid ONNX`, 'success');
            addOutput(`Opset Version: ${opsetVersion}`, 'info');
            addOutput(`Producer: ${producerName}`, 'info');

            // Extract operators
            const nodes = model.graph?.node || [];
            const operatorNames = Array.from(new Set(nodes.map((node) => node.opType))); // Deduplicate operators

            // Categorize operators
            const categorizedOperators = categorizeOperators(operatorNames, operatorData);

            // Log categorized operators
            addOutput(`Supported Operators: ${categorizedOperators.supported.length}`, 'success');
            addOutput(`Sentis-Only Operators: ${categorizedOperators.sentisOnly.length}`, 'warning');
            addOutput(`Unsupported Operators: ${categorizedOperators.unsupported.length}`, 'error');
            addOutput(`Unknown Operators: ${categorizedOperators.unknown.length}`, 'info');

            // Update state
            setOperatorList(categorizedOperators.all);
            setModelStats({
                supportedCount: categorizedOperators.supported.length,
                sentisOnlyCount: categorizedOperators.sentisOnly.length,
                unsupportedCount: categorizedOperators.unsupported.length,
                unknownCount: categorizedOperators.unknown.length,
            });

            addOutput('\nOperator Compatibility Analysis Completed.', 'success', 'header');
        } catch (error) {
            addOutput('❌ Error parsing ONNX model', 'error', 'header');
            addOutput(`${error}`, 'error', 'detail');
        } finally {
            setIsProcessing(false);
        }
    };

    const categorizeOperators = (operators: string[], operatorData: OperatorData) => {
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

    const handleOperatorFileSelect = () => {
        operatorFileInputRef.current?.click();
    };

    const handleOperatorFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            loadOperatorData(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        dropZoneRef.current?.classList.add('bg-blue-50');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        dropZoneRef.current?.classList.remove('bg-blue-50');
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dropZoneRef.current?.classList.remove('bg-blue-50');

        const file = Array.from(e.dataTransfer.files)[0];
        if (file && file.name.endsWith('.onnx')) {
            addOutput(`Processing file: ${file.name}`, 'info');
            const arrayBuffer = await file.arrayBuffer();
            await parseONNXModel(arrayBuffer);
        } else {
            addOutput('Please drop a valid ONNX model file (.onnx)', 'error');
        }
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            clearOutput();
            const arrayBuffer = await file.arrayBuffer();
            await parseONNXModel(arrayBuffer);
        }
    };

    const handleUrlSubmit = async () => {
        if (!urlInput.trim()) {
            addOutput('⚠️ Please enter a URL', 'warning');
            return;
        }

        clearOutput();

        setIsProcessing(true);
        try {
            addOutput(`Downloading model from: ${urlInput}`, 'info');
            const response = await fetch(urlInput);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            await parseONNXModel(arrayBuffer);
        } catch (error) {
            addOutput('❌ Error downloading model', 'error', 'header');
            addOutput(`${error}`, 'error', 'detail');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-4">
            <div className="bg-white shadow-lg rounded-lg p-6">
                <h1 className="text-2xl font-bold text-center mb-6">
                    ONNX Model Inspector
                </h1>

                {/* Status Bar */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div className="text-sm">
                            Status: {operatorDataLoaded ? '✓ Ready' : '⚠️ Load operator data to begin'}
                        </div>
                        {isProcessing && (
                            <div className="text-blue-500">
                                Processing...
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">

                    {/* Dropdown for version selection */}
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold mb-4">1. Select Version:</h2>
                        <select
                            value={selectedVersion}
                            onChange={handleVersionChange}
                            className="block w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-500"
                            disabled={versions.length === 0}
                        >
                            {versions.map((version) => (
                                <option key={version.file} value={version.file}>
                                    {version.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Model Input Section */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h2 className="text-lg font-semibold mb-4">2. Load ONNX Model</h2>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileInputChange}
                            accept=".onnx"
                            className="hidden"
                        />

                        <div
                            ref={dropZoneRef}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer 
                hover:bg-gray-50 transition-colors mb-4
                ${!operatorDataLoaded ? 'opacity-50' : ''}`}
                            onClick={operatorDataLoaded ? handleFileSelect : undefined}
                        >
                            <p className="text-gray-600">
                                {operatorDataLoaded
                                    ? 'Drop your ONNX model here or click to browse'
                                    : 'Load operator data first'}
                            </p>
                        </div>

                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="Enter ONNX model URL"
                                className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${!operatorDataLoaded ? 'opacity-50' : ''}`}
                                disabled={!operatorDataLoaded || isProcessing}
                            />
                            <button
                                onClick={handleUrlSubmit}
                                className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors
                  ${(!operatorDataLoaded || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!operatorDataLoaded || isProcessing}
                            >
                                Download & Check
                            </button>
                        </div>
                    </div>


                    {/* Operator Table */}
                    {operatorList.length > 0 && (
                        <div className="border rounded-lg p-4 bg-white overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                <tr className="text-left text-gray-600">
                                    <th className="px-4 py-2 font-bold">Operator Name</th>
                                    <th className="px-4 py-2 font-bold">Status</th>
                                    <th className="px-4 py-2 font-bold">BackendType.CPU</th>
                                    <th className="px-4 py-2 font-bold">BackendType.GPUCompute</th>
                                    <th className="px-4 py-2 font-bold">BackendType.GPUPixel</th>
                                </tr>
                                </thead>
                                <tbody>
                                {operatorList.map((operator, index) => (
                                    <tr
                                        key={index}
                                        className={`${
                                            index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                        }`}
                                    >
                                        <td className="px-4 py-2">{operator.name}</td>
                                        <td
                                            className={`px-4 py-2 font-bold ${
                                                operator.status === 'supported'
                                                    ? 'text-green-600'
                                                    : operator.status === 'unsupported'
                                                        ? 'text-red-600'
                                                        : operator.status === 'sentisOnly'
                                                            ? 'text-yellow-600'
                                                            : 'text-gray-600'
                                            }`}
                                        >
                                            {operator.status.replace(/([A-Z])/g, ' $1').trim()}
                                        </td>
                                        <td className="px-4 py-2">
                                            {operator.cpuSupport || '-'}
                                        </td>
                                        <td className="px-4 py-2">
                                            {operator.gpuComputeSupport || '-'}
                                        </td>
                                        <td className="px-4 py-2">
                                            {operator.gpuPixelSupport || '-'}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}



                    {/* Output Log */}
                    {output.length > 0 && (
                        <div className="border rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto bg-white">
                            {output.map((item, index) => (
                                <div
                                    key={index}
                                    className={`mb-2 p-3 ${
                                        item.type === 'success'
                                            ? 'text-green-700'
                                            : item.type === 'warning'
                                                ? 'text-yellow-700'
                                                : item.type === 'error'
                                                    ? 'text-red-700'
                                                    : item.type === 'info'
                                                        ? 'text-blue-700'
                                                        : 'text-gray-700'
                                    }`}
                                >
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Clear Output Button */}
                    <button
                        onClick={clearOutput}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors w-full"
                        disabled={isProcessing}
                    >
                        Clear Output
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper function to determine output item classes
const getItemClasses = (item: OutputItem): string => {
    const baseClasses = "mb-2 p-3 rounded-lg ";
    let classes = baseClasses;

    if (item.category === 'header') {
        classes += 'font-bold ';
    } else if (item.category === 'detail') {
        classes += 'ml-4 text-sm ';
    }

    switch (item.type) {
        case 'success':
            classes += 'bg-green-50 text-green-700';
            break;
        case 'warning':
            classes += 'bg-yellow-50 text-yellow-700';
            break;
        case 'error':
            classes += 'bg-red-50 text-red-700';
            break;
        case 'info':
            classes += 'bg-blue-50 text-blue-700';
            break;
        default:
            classes += 'bg-gray-50 text-gray-700';
    }

    return classes;
};

export default ONNXInspector;