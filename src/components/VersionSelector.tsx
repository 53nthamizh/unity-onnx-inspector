import React from 'react';

interface VersionSelectorProps {
    versions: { label: string; file: string }[];
    selectedVersion: string;
    onVersionChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const VersionSelector: React.FC<VersionSelectorProps> = ({ versions, selectedVersion, onVersionChange }) => {
    return (
        <div className="mb-4">
            <h2 className="text-lg font-semibold mb-4">1. Select Version:</h2>
            <select
                value={selectedVersion}
                onChange={onVersionChange}
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
    );
};

export default VersionSelector;
