import React, { useState } from "react";

const App = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPredictions([]);
    }
  };

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  const runDetection = async () => {
    if (!selectedImage) return;
  
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result?.toString();
      if (!dataUrl) return;
  
      // Extract just the base64 part (remove data:image/jpeg;base64, prefix)
      const base64 = dataUrl.split(',')[1];
      
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/detect`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageBase64: base64 }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        setPredictions(data.predictions || []);
      } catch (error) {
        console.error("Detection error:", error.message || error);
        alert(`Detection failed: ${error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
  
    reader.readAsDataURL(selectedImage);
  };  

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4 text-green-700">
        Tomato Leaf Disease Detector
      </h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mb-4"
      />

      {previewUrl && (
        <div className="relative mb-4 border border-gray-300 rounded shadow">
          <img
            src={previewUrl}
            alt="Selected"
            className="max-w-full h-auto rounded"
          />
          {predictions.map((pred, i) => (
            <div
              key={i}
              className="absolute border-2 border-red-500"
              style={{
                top: `${pred.y - pred.height / 2}px`,
                left: `${pred.x - pred.width / 2}px`,
                width: `${pred.width}px`,
                height: `${pred.height}px`,
              }}
            >
              <span className="absolute -top-5 left-0 bg-red-500 text-white text-xs px-1 rounded">
                {pred.class} ({(pred.confidence * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={runDetection}
        disabled={!selectedImage || loading}
        className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? "Detecting..." : "Run Detection"}
      </button>

      {predictions.length > 0 && (
        <div className="mt-4 w-full max-w-md">
          <h2 className="text-lg font-semibold mb-2">Predictions</h2>
          <ul className="bg-white shadow rounded p-4 space-y-2">
            {predictions.map((pred, i) => (
              <li key={i} className="text-sm">
                <strong>{pred.class}</strong> – {(
                  pred.confidence * 100
                ).toFixed(2)}
                % confidence
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;