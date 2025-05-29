import React, { useState } from "react";

const App = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [context, setContext] = useState("This is a tomato plant grown in Plateau State, Nigeria.");

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPredictions([]);
      setHealth(null);
      setAdvice(null);
    }
  };

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  const runDetection = async () => {
    if (!selectedImage) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result?.toString();
      if (!dataUrl) return;

      const base64 = dataUrl.split(',')[1]; // Strip prefix
      setLoading(true);

      try {
        const response = await fetch(`${BACKEND_URL}/detect`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageBase64: base64, context }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        setPredictions(data.predictions || []);
        setHealth(data.healthStatus || null);
        setAdvice(data.chatgptAdvice || null);
      } catch (error) {
        console.error("Detection error:", error.message || error);
        alert(`Detection failed: ${error.message || "Unknown error"}`);
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

      <textarea
        className="mb-4 w-full max-w-lg p-2 rounded border border-gray-300"
        rows={3}
        placeholder="Add extra context (e.g., plant type, location, weather)..."
        value={context}
        onChange={(e) => setContext(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mb-4"
      />

      {previewUrl && (
        <div className="relative mb-4 border border-gray-300 rounded shadow">
          <img src={previewUrl} alt="Selected" className="max-w-full h-auto rounded" />
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

      {(health || advice) && (
        <div className="mt-6 w-full max-w-lg bg-white p-4 rounded shadow">
          {health && (
            <p className="text-green-700 font-semibold mb-2">
              🌿 Plant Health Score: {health.toFixed(1)}%
            </p>
          )}
          {advice && (
            <>
              <h2 className="text-lg font-bold mb-1">💡 Farming Advice</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{advice}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;