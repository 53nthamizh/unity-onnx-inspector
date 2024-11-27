const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'public/assets/xlsx');
const outputPath = path.join(directoryPath, 'fileList.json');

// Read the directory and filter for .xlsx files
fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    const xlsxFiles = files.filter((file) => file.endsWith('.xlsx'));
    fs.writeFileSync(outputPath, JSON.stringify(xlsxFiles, null, 2));
    console.log('fileList.json has been updated:', xlsxFiles);
});
