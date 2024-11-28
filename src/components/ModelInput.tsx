import React, { useRef } from 'react';

interface ModelInputProps {
    onFileSelect: () => void;
    onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    operatorDataLoaded: boolean;
    isProcessing: boolean;
    onUrlSubmit: () => void;
    urlInput: string;
    setUrlInput: (url: string) => void;
}

const ModelInput: React.FC<ModelInputProps> = ({
                                                   onFileSelect,
                                                   onFileInputChange,
                                                   onDrop,
                                                   onDragOver,
                                                   onDragLeave,
                                                   operatorDataLoaded,
                                                   isProcessing,
                                                   onUrlSubmit,
                                                   urlInput,
                                                   setUrlInput,
                                               }) => {
    const dropZoneRef = useRef<HTMLDivElement>(null);

    return (
        <div className="border rounded-lg p-4 bg-gray-50">
            <h2 className="text-lg font-semibold mb-4">2. Load ONNX Model</h2>
            <input
                type="file"
                onChange={onFileInputChange}
                accept=".onnx"
                className="hidden"
            />

            <div
                ref={dropZoneRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer 
                hover:bg-gray-50 transition-colors mb-4
                ${!operatorDataLoaded ? 'opacity-50' : ''}`}
                onClick={operatorDataLoaded ? onFileSelect : undefined}
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
                    onClick={onUrlSubmit}
                    className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors
                  ${(!operatorDataLoaded || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!operatorDataLoaded || isProcessing}
                >
                    Download & Check
                </button>
            </div>
        </div>
    );
};

export default ModelInput;
