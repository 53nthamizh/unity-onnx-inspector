# ONNX Model Inspector for Unity

Welcome to the ONNX Model Inspector – a simple web application designed to analyze and inspect ONNX models with ease. This tool allows you to inspect and evaluate the operator compatibility with backend systems like CPU and GPU.

## 🚀 Features

- **Version Selection**: Choose from different versions of operator data stored in an `assets/xlsx/` directory. The versions are dynamically fetched, making it easy to compare different model versions.
- **Operator Compatibility Analysis**: Inspect the operators in an ONNX model and view their compatibility with various backends like CPU, GPUCompute, and GPUPixel. Operators are categorized as supported, Sentis-only, unsupported, or unknown.
- **Dynamic Operator Data**: Upload your ONNX models and get real-time compatibility analysis based on the selected version of operator data.
- **Interactive Output**: Get a clear and concise report of the operator compatibility, with detailed backend support for each operator.

## ⚙️ Technical Stack

- **React.js**
- **XLSX.js**
- **protobufjs** 
- **TailwindCSS**

## 📦 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/53nthamizh/unity-onnx-inspector.git
cd unity-onnx-inspector
npm install
```

## Running Locally

To run the app locally for development:

```bash
npm start
```

This will start the development server and open the app in your default browser.

## 🖼️ Screenshots

Here’s how it looks in action:

[TODO: Add screenshots]

1. **Select Version**: Choose the version of the operator data to be used for compatibility checks.
2. **Load Operator Data**: Load operator data for a specific version and check the backend support.
3. **Load ONNX Model**: Upload or drag-and-drop an ONNX model file to analyze its operator compatibility.
4. **View Operator Compatibility**: View detailed backend support (CPU, GPUCompute, GPUPixel) for each operator, categorized into supported, Sentis-only, unsupported, and unknown.

## 💡 Usage

1. Choose a version of operator data from the dropdown.
2. Load operator data from the selected version.
3. Upload your ONNX model (either by choosing a file or drag-and-drop).
4. View detailed analysis of the operators and backend support.

## 🤖 How It Works

- **Version Selection**: The versions are fetched from the `/assets/xlsx/` directory.
- **Operator Data Loading**: The operator data is loaded from an Excel sheet containing detailed information about the supported operators, Sentis-only operators, and unsupported operators.
- **ONNX Model Analysis**: Once the model is uploaded, the ONNX file is parsed, and its operators are compared against the operator data to generate a detailed compatibility report.

## 🌐 Live Demo

You can try a live demo of the ONNX Model Inspector on our website: [TODO: Add Live Demo Link]

## 💬 Contributing

If you have ideas, suggestions, or find any bugs, feel free to submit an issue or pull request. All contributions are appreciated!

### Steps to Contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a new Pull Request

## 📄 License

![CC0 1.0 Universal (CC0 1.0) Public Domain Dedication](https://licensebuttons.net/p/zero/1.0/88x31.png)

This project is licensed under the CC0 1.0 Universal (CC0 1.0) Public Domain Dedication.

You are free to use, modify, and distribute the project without any restrictions.