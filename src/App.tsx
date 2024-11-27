import React from 'react';
import './App.css';
import ONNXInspector from "./components/ONNXInspector";

const App: React.FC = () => {
  return (
      <div className="App">
        <header className="App-header">
          <ONNXInspector />
        </header>
      </div>
  );
};

export default App;
