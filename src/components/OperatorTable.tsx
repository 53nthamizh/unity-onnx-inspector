import React from 'react';
import { OperatorInfo } from '../types/ONNXInterfaces';

interface OperatorTableProps {
    operatorList: OperatorInfo[];
}

const OperatorTable: React.FC<OperatorTableProps> = ({ operatorList }) => {
    return (
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
                        className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                    >
                        <td className="px-4 py-2">{operator.name}</td>
                        <td className={`px-4 py-2 font-bold ${getStatusColor(operator.status)}`}>
                            {operator.status.replace(/([A-Z])/g, ' $1').trim()}
                        </td>
                        <td className="px-4 py-2">{operator.cpuSupport || '-'}</td>
                        <td className="px-4 py-2">{operator.gpuComputeSupport || '-'}</td>
                        <td className="px-4 py-2">{operator.gpuPixelSupport || '-'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'supported':
            return 'text-green-600';
        case 'unsupported':
            return 'text-red-600';
        case 'sentisOnly':
            return 'text-yellow-600';
        default:
            return 'text-gray-600';
    }
};

export default OperatorTable;
