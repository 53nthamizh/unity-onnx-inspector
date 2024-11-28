import React, { useState } from "react";
import { ValueInfoProto } from "../types/ONNXInterfaces";

interface InputOutputDetailsProps {
    title: string;
    details: ValueInfoProto[];
}

const InputOutputDetails: React.FC<InputOutputDetailsProps> = ({ title, details }) => {
    const formatValueInfo = (info: ValueInfoProto) => {
        const shape =
            info.type?.tensorType?.shape?.dim
                ?.map((dim) => (dim.dimValue !== undefined ? dim.dimValue : dim.dimParam ?? "dynamic"))
                .join(", ") || "Unknown shape";

        const dataType = info.type?.tensorType?.elemType || "Unknown";

        return {
            name: info.name,
            shape: `[${shape}]`,
            dataType,
        };
    };

    const [searchTerm, setSearchTerm] = useState("");
    const filteredDetails = details.filter((detail) =>
        detail.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
            {details.length > 0 ? (
                <>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-4 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    />
                    {/* Scrollable container */}
                    <div className="overflow-y-auto max-h-[400px] border border-gray-200 rounded-lg">
                        <table className="w-full min-w-max table-auto">
                            <thead>
                            <tr className="bg-gray-100 text-left sticky top-0">
                                    <th className="p-2 whitespace-no-wrap">Name</th>
                                    <th className="p-2 whitespace-no-wrap">Shape</th>
                                    <th className="p-2 whitespace-no-wrap">Data Type</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredDetails.map((detail, index) => {
                                const { name, shape, dataType } = formatValueInfo(detail);
                                return (
                                    <tr key={index} className="border-b border-gray-300">
                                            <td className="p-2 whitespace-no-wrap">{name}</td>
                                            <td className="p-2 text-gray-500 whitespace-no-wrap">{shape}</td>
                                            <td className="p-2 text-gray-500 whitespace-no-wrap">{dataType}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <p className="text-base text-gray-500">No details available.</p>
            )}
        </div>
    );
};

export default InputOutputDetails;
