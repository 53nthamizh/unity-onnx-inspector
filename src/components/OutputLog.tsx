import React from 'react';
import { OutputItem } from '../types/ONNXInterfaces';

interface OutputLogProps {
    output: OutputItem[];
    clearOutput: () => void;
    isProcessing: boolean;
}

const OutputLog: React.FC<OutputLogProps> = ({ output, clearOutput, isProcessing }) => {
    return (
        <div>
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
            <button
                onClick={clearOutput}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors w-full"
                disabled={isProcessing}
            >
                Clear Output
            </button>
        </div>
    );
};

export default OutputLog;
