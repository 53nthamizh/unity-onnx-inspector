import React, { useState, useRef, useEffect } from "react";
import VersionSelector from "./VersionSelector";
import ModelInput from "./ModelInput";
import OperatorTable from "./OperatorTable";
import OutputLog from "./OutputLog";
import * as XLSX from "xlsx";
import protobuf from "protobufjs";
import {
    ModelProto,
    NodeProto,
    OperatorData,
    OutputItem,
    OperatorInfo,
    ValueInfoProto
} from "../types/ONNXInterfaces";
import { categorizeOperators } from "../utils/categorizeOperators";
import InputOutputDetails from "./InputOutputDetails";

const ONNXInspector: React.FC = () => {
    const [versions, setVersions] = useState<{ label: string; file: string }[]>(
        []
    );
    const [selectedVersion, setSelectedVersion] = useState<string>("");
    const [output, setOutput] = useState<OutputItem[]>([]);
    const [urlInput, setUrlInput] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [operatorDataLoaded, setOperatorDataLoaded] = useState(false);
    const [modelStats, setModelStats] = useState({
        supportedCount: 0,
        sentisOnlyCount: 0,
        unsupportedCount: 0,
        unknownCount: 0,
    });
    const [operatorData, setOperatorData] = useState<OperatorData>({
        supported: {},
        sentisOnly: {},
        unsupported: new Set(),
    });
    const [operatorList, setOperatorList] = useState<OperatorInfo[]>([]);
    const [modelInputs, setModelInputs] = useState<ValueInfoProto[]>([]);
    const [modelOutputs, setModelOutputs] = useState<ValueInfoProto[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const addOutput = (
        text: string,
        type: OutputItem["type"] = "default",
        category?: "header" | "detail"
    ) => {
        setOutput((prev) => [...prev, { text, type, category }]);
    };

    const clearOutput = () => {
        setOutput([]);
        setModelStats({
            supportedCount: 0,
            sentisOnlyCount: 0,
            unsupportedCount: 0,
            unknownCount: 0,
        });
        setOperatorList([]);
    };

    const fetchVersions = async () => {
        try {
            const response = await fetch(
                `${process.env.PUBLIC_URL}/assets/fileList.json`
            );
            if (!response.ok) throw new Error("Failed to fetch file list.");

            const files = await response.json();
            const versionOptions = files.map((file: string) => ({
                label: file.replace(".xlsx", ""),
                file: `${process.env.PUBLIC_URL}/assets/xlsx/${file}`,
            }));

            setVersions(versionOptions);
            setSelectedVersion(versionOptions[0]?.file || "");
        } catch (error) {
            addOutput(`Error fetching versions: ${(error as Error).message}`, "error");
            console.error(error);
        }
    };

    const handleVersionChange = async (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const selectedFile = event.target.value;
        setSelectedVersion(selectedFile);

        try {
            setIsProcessing(true);
            const response = await fetch(selectedFile);
            if (!response.ok) throw new Error(`Failed to fetch the file: ${selectedFile}`);

            const arrayBuffer = await response.arrayBuffer();
            const file = new Blob([arrayBuffer]);

            await loadOperatorData(file);
        } catch (error) {
            addOutput(`Error loading file: ${(error as Error).message}`, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const loadOperatorData = async (file: Blob) => {
        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer);

            const supported: OperatorData["supported"] = {};
            const sentisOnly: OperatorData["sentisOnly"] = {};
            const unsupported = new Set<string>();

            // Parse sheets
            try {
                const supportedSheet = workbook.Sheets["Supported ONNX operators"];
                const supportedData = XLSX.utils.sheet_to_json<any>(supportedSheet, {
                    header: 1,
                });

                supportedData.slice(1).forEach((row: any[]) => {
                    const operator = row[0]?.trim();
                    if (!operator) return;
                    supported[operator] = {
                        CPU: row[1]?.trim() || "-",
                        GPUCompute: row[2]?.trim() || "-",
                        GPUPixel: row[3]?.trim() || "-",
                    };
                });
            } catch (e) {
                addOutput("Warning: Error parsing supported operators sheet", "warning");
            }

            try {
                const sentisSheet = workbook.Sheets["Sentis only layers"];
                const sentisData = XLSX.utils.sheet_to_json<any>(sentisSheet, {
                    header: 1,
                });

                sentisData.slice(1).forEach((row: any[]) => {
                    const operator = row[0]?.trim();
                    if (!operator) return;
                    sentisOnly[operator] = {
                        CPU: row[1]?.trim() || "-",
                        GPUCompute: row[2]?.trim() || "-",
                        GPUPixel: row[3]?.trim() || "-",
                    };
                });
            } catch (e) {
                addOutput("Warning: Error parsing Sentis-only operators sheet", "warning");
            }

            try {
                const unsupportedSheet = workbook.Sheets["Unsupported Operators"];
                const unsupportedData = XLSX.utils.sheet_to_json<any>(unsupportedSheet, {
                    header: 1,
                });

                unsupportedData.slice(1).forEach((row: any[]) => {
                    const operator = row[0]?.trim();
                    if (operator) unsupported.add(operator);
                });
            } catch (e) {
                addOutput("Warning: Error parsing unsupported operators sheet", "warning");
            }

            setOperatorData({ supported, sentisOnly, unsupported });
            setOperatorDataLoaded(true);
            addOutput("✓ Operator data loaded successfully", "success", "header");
        } catch (error) {
            addOutput("❌ Failed to load operator data", "error", "header");
        } finally {
            setIsProcessing(false);
        }
    };


    const parseONNXModel = async (arrayBuffer: ArrayBuffer) => {
        try {
            addOutput("Parsing ONNX model...", "info");

            // Load the ONNX proto definition
            const root = await protobuf.load(`${process.env.PUBLIC_URL}/onnx.proto3`);
            const ModelProto = root.lookupType("onnx.ModelProto");

            // Decode the ONNX model and cast it to the `ModelProto` type
            const model = ModelProto.decode(new Uint8Array(arrayBuffer)) as unknown as ModelProto;

            addOutput("Model parsed successfully.", "success");

            // Extract metadata
            const opsetImports = model.opsetImport || [];
            const opsetVersion = opsetImports.length > 0 ? opsetImports[0].version : "Unknown";
            const producerName = model.producerName || "Unknown";

            addOutput(`Opset Version: ${opsetVersion}`, "info");
            addOutput(`Producer: ${producerName}`, "info");

            // Extract operator information
            const nodes = model.graph?.node || [];
            const operatorNames: string[] = Array.from(new Set(nodes.map((node: NodeProto) => node.opType)));

            // Extract inputs and outputs
            const inputs = model.graph?.input || [];
            const outputs = model.graph?.output || [];

            setModelInputs(inputs); // Set the inputs state
            setModelOutputs(outputs); // Set the outputs state

            // Categorize operators
            const categorizedOperators = categorizeOperators(operatorNames, operatorData);

            setOperatorList(categorizedOperators.all);
            setModelStats({
                supportedCount: categorizedOperators.supported.length,
                sentisOnlyCount: categorizedOperators.sentisOnly.length,
                unsupportedCount: categorizedOperators.unsupported.length,
                unknownCount: categorizedOperators.unknown.length,
            });

            addOutput("ONNX model parsing completed.", "success", "header");
        } catch (error) {
            addOutput("Error parsing ONNX model.", "error");
            console.error("Parsing Error:", error);
        }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const file = Array.from(e.dataTransfer.files)[0];
        if (file && file.name.endsWith(".onnx")) {
            addOutput(`Processing file: ${file.name}`, "info");
            const arrayBuffer = await file.arrayBuffer();
            await parseONNXModel(arrayBuffer);
        } else {
            addOutput("Please drop a valid ONNX model file (.onnx)", "error");
        }
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            addOutput(`Processing file: ${file.name}`, "info");
            const arrayBuffer = await file.arrayBuffer();
            await parseONNXModel(arrayBuffer);
        } else {
            addOutput("No file selected.", "warning");
        }
    };

    useEffect(() => {
        fetchVersions();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold text-center mb-6">
                ONNX Model Inspector
            </h1>

            {/* Version Selector */}
            <VersionSelector
                versions={versions}
                selectedVersion={selectedVersion}
                onVersionChange={handleVersionChange}
            />

            {/* Model Input */}
            <ModelInput
                onFileSelect={() => fileInputRef.current?.click()}
                onFileInputChange={handleFileInputChange}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => e.preventDefault()}
                operatorDataLoaded={operatorDataLoaded}
                isProcessing={isProcessing}
                onUrlSubmit={() => console.log("URL Submitted")} // Handle URL submission
                urlInput={urlInput}
                setUrlInput={setUrlInput}
            />

            {/* Operator Table */}
            {operatorList.length > 0 && <OperatorTable operatorList={operatorList} />}

            {/* Output Log */}
            <OutputLog
                output={output}
                clearOutput={clearOutput}
                isProcessing={isProcessing}
            />
            {/* Inputs and Outputs */}
            <InputOutputDetails title="Model Inputs" details={modelInputs} />
            <InputOutputDetails title="Model Outputs" details={modelOutputs} />
        </div>
    );

};

export default ONNXInspector;
