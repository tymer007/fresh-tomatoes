import React, { useState } from "react";
import { Upload, Camera, AlertCircle, Leaf } from "lucide-react";

const App = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [adviceHtml, setAdviceHtml] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [context, setContext] = useState(
    "I have noticed a disease on my tomato plant in my home garden at Plateau State, Nigeria. The leaves are showing some unusual spots and I'm concerned about the plant's health."
  );

  const handleImageChange = (file) => {
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Only JPEG, PNG, and WebP images are allowed");
        return;
      }

      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPredictions([]);
      setHealth(null);
      setAdviceHtml(null);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    handleImageChange(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  };

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  const runDetection = async () => {
    if (!selectedImage) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result?.toString();
      if (!dataUrl) return;

      const base64 = dataUrl.split(",")[1];
      setLoading(true);

      try {
        const response = await fetch(`${BACKEND_URL}/detect`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageBase64: base64, context }),
        });

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        setPredictions(data.predictions || []);
        setHealth(data.healthStatus || null);
        setAdviceHtml(data.adviceHtml || null);
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-4xl font-bold text-red-700">
              🍅 Tomato Disease Detector
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Advanced AI-powered detection for healthier tomato plants
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload Section */}
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Upload Tomato Plant Leaf Image
              </h2>

              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 hover:border-red-400 hover:bg-red-50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop your image here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported formats: JPEG, PNG, WebP (max 5MB)
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      <strong>Tip:</strong> The clearer and better quality your
                      image, the more accurate our detection will be. Ensure
                      good lighting and focus.
                    </p>
                  </div>
                </div>
              </div>

              {/* Context Input */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  rows={4}
                  placeholder="Describe what you've observed..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>

              {/* Analyze Button */}
              <button
                onClick={runDetection}
                disabled={!selectedImage || loading}
                className={`w-full mt-6 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                  !selectedImage || loading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </div>
                ) : (
                  "Analyze Plant Health"
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Preview and Results */}
          <div className="space-y-6">
            {/* Image Preview */}
            {previewUrl && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Image Preview
                </h3>
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={previewUrl}
                    alt="Selected plant"
                    className="w-full h-auto max-h-96 object-contain bg-gray-50"
                  />
                  {predictions.map((pred, i) => (
                    <div
                      key={i}
                      className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20"
                      style={{
                        top: `${pred.y - pred.height / 2}px`,
                        left: `${pred.x - pred.width / 2}px`,
                        width: `${pred.width}px`,
                        height: `${pred.height}px`,
                      }}
                    >
                      <span className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                        {pred.class} ({(pred.confidence * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {(health !== null || adviceHtml) && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Analysis Results
                </h3>

                {health !== null && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        🍅 Tomatoe Plant Health Score
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {health.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          health >= 80
                            ? "bg-green-500"
                            : health >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${health}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {adviceHtml && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                      <Leaf className="w-4 h-4 mr-2 text-green-600" />
                      Farming Recommendations
                    </h4>
                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: adviceHtml }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
