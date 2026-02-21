import React, { useState } from "react";
import { Upload, Camera, AlertCircle, Leaf, Menu, X, Star, ChevronDown, ChevronUp } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

const App = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [adviceHtml, setAdviceHtml] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [context, setContext] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleImageChange = (file) => {
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
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
        toast.error("Only JPEG, PNG, and WebP images are allowed");
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
        toast.error(`Detection failed: ${error.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(selectedImage);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const getHealthRating = (health) => {
    if (health >= 85) return { rating: "Excellent Health", color: "text-tomGreen", image: "tom_rating_1.png" };
    if (health >= 65) return { rating: "Good Health", color: "text-green-600", image: "tom_rating_2.png" };
    if (health >= 50) return { rating: "Fair Health", color: "text-yellow-600", image: "tom_rating_3.png" };
    return { rating: "Poor Health", color: "text-tomRed", image: "tom_rating_4.png" };
  };

  const testimonials = [
    {
      quote: "This tool helped me identify early blight before it spread to my entire crop. Saved my season!",
      name: "Ibrahim Yusuf",
      role: "Tomato Farmer",
      avatar: "👨‍🌾"
    },
    {
      quote: "Simple to use and gives practical advice. No technical jargon, just what I need to know.",
      name: "Mary Okafor",
      role: "Extension Officer",
      avatar: "👩‍🔬"
    },
    {
      quote: "The research dataset feature helps us understand disease patterns across different regions.",
      name: "Dr. Sarah Ahmad",
      role: "Plant Pathologist",
      avatar: "👩‍🎓"
    }
  ];

  const faqs = [
    {
      question: "What is freshtomatoes?",
      answer: "A simple tool to help you check plant health. Upload a clear photo to get a short diagnosis and practical advice."
    },
    {
      question: "Is my data safe?",
      answer: "Yes. We ask for consent and your images are not being stored by us."
    },
    {
      question: "Does it replace a lab test or extension officer?",
      answer: "No — it's an early, practical step. For severe problems we recommend contacting local extension or a plant pathologist."
    },
    {
      question: "How accurate is the diagnosis?",
      answer: "We use automated tools plus guidance from plant experts. Use the advice as a first step."
    },
    {
      question: "Can I use this offline?",
      answer: "Uploading and analysis require an internet connection."
    }
  ];

  const submitFeedback = () => {
    if (rating > 0) {
      toast.success("Thank you for your feedback!");
      setRating(0);
      setFeedback("");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sora">
      {/* Navbar */}
      <nav className="sticky top-0 bg-tomRed text-white shadow-sm z-50 opacity-95 border-tomDarkRed">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img src="frsh_tom_logo.png" alt="Fresh Tomatoes Logo" className="w-36" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('home')} className="hover:text-tomWhite transition-colors">Home</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-tomWhite transition-colors">How to Use</button>
              <button onClick={() => scrollToSection('reviews')} className="hover:text-tomWhite transition-colors">Reviews</button>
              <button onClick={() => scrollToSection('faq')} className="hover:text-tomWhite transition-colors">FAQ</button>
              <button onClick={() => scrollToSection('home')} className="bg-white text-tomRed px-4 py-2 rounded-lg hover:bg-tomDarkWhite transition-colors">
                Analyze a Plant
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4">
                <button onClick={() => scrollToSection('home')} className="text-tomWhite hover:text-white transition-colors text-left">Home</button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-tomWhite hover:text-white transition-colors text-left">How to Use</button>
                <button onClick={() => scrollToSection('reviews')} className="text-tomWhite hover:text-white transition-colors text-left">Reviews</button>
                <button onClick={() => scrollToSection('faq')} className="text-tomWhite hover:text-white transition-colors text-left">FAQ</button>
                <button onClick={() => scrollToSection('home')} className="bg-white text-tomRed px-4 py-2 rounded-lg hover:bg-tomDarkWhite transition-colors w-fit">
                  Analyze a Plant
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="py-16 px-4 bg-gradient-to-br from-tomWhite to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-9">
            <div className="flex items-center justify-center mb-3">
              <img src="frsh_tom_clrd_crvd.png" alt="Fresh Tomatoes Logo" className="w-64" />
            </div>
            <h1 className="text-5xl font-bold text-tomDrkrGreen mb-4">Analyze your tomato plant</h1>
            <p className="text-xl text-tomDarkGreen">Instant diagnosis and practical advice for healthier crops</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Upload Panel */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-tomDarkWhite">
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 mb-6 ${dragActive
                  ? "border-tomRed bg-tomWhite"
                  : "border-tomDarkWhite hover:border-tomRed hover:bg-tomWhite"
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

                <Upload className="w-12 h-12 text-tomDarkGreen mx-auto mb-4" />
                <p className="text-lg font-medium text-tomDrkrGreen mb-2">
                  Drop an image or click to upload
                </p>
                <p className="text-sm text-tomDarkGreen">
                  JPEG, PNG — max 5MB
                </p>
              </div>

              <button className="w-full bg-tomDarkWhite text-tomDrkrGreen py-3 px-6 rounded-lg font-medium mb-6 md:hidden hover:bg-tomWhite transition-colors">
                📱 Use camera
              </button>

              <textarea
                className="w-full p-4 rounded-lg border border-tomDarkWhite focus:ring-2 focus:ring-tomRed focus:border-tomRed resize-none mb-6"
                rows={3}
                placeholder="Tell us what you've noticed (optional)"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />

              <button
                onClick={runDetection}
                disabled={!selectedImage || loading}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${!selectedImage || loading
                  ? "bg-tomDarkWhite cursor-not-allowed text-tomDrkrGreen"
                  : "bg-tomRed hover:bg-tomDarkRed shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </div>
                ) : (
                  "Analyze Plant"
                )}
              </button>

              <p className="text-sm text-tomDarkGreen mt-4 text-center">
                We'll send clear next steps and a simple health score.{" "}
                {/* <a href="#" className="text-tomRed hover:underline">Privacy policy</a> */}
              </p>
            </div>

            {/* Right Column - Tomato Image or Preview */}
            <div className="flex justify-center">
              <div className="rounded-2xl overflow-hidden place-content-center place-items-center justify-center relative">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Selected plant"
                      className="w-full h-auto max-w-lg object-cover rounded-2xl"
                    />
                    {/* Disease Info Overlay */}
                    {predictions.length > 0 && health !== null && (
                      <div className="absolute top-4 right-4">
                        <div className="h-12 w-36 bg-tomRed rounded-l-lg relative text-center flex flex-col justify-center text-white">
                          <div className="text-xs font-medium leading-tight">
                            {predictions[0]?.class || 'Disease'}
                          </div>
                          <div className="text-lg font-bold">
                            {health.toFixed(0)}%
                          </div>
                          {/* Arrow pointing right */}
                          <div className="absolute -top-1 -right-10 w-10 h-10 bg-tomRed transform rotate-45 origin-top-left rounded-lg"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src="tom_wreath.webp"
                    alt="Healthy tomato plant"
                    className="w-full h-auto max-w-lg object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section - Show below main content after analysis */}
      {(health !== null || adviceHtml) && (
        <section className="py-16 px-4 bg-tomWhite">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-tomDrkrGreen mb-8 text-center">Analysis Results</h3>

              {health !== null && (
                <div className="mb-8 text-center">
                  <div className="flex justify-center">
                  <img src={getHealthRating(health).image} alt="Health rating" className="w-16 text-center" />
                  </div>
                  <div className={`text-3xl font-bold ${getHealthRating(health).color} mb-4`}>
                    {getHealthRating(health).rating}
                  </div>
                  <div className="text-4xl font-bold text-tomRed mb-6">
                    Health: {health.toFixed(0)}%
                  </div>
                  <div className="w-full bg-tomDarkWhite rounded-full h-4 mx-auto max-w-md">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${health >= 80
                        ? "bg-tomGreen"
                        : health >= 60
                          ? "bg-yellow-500"
                          : "bg-tomRed"
                      }`}
                      style={{ width: `${health}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {adviceHtml && (
                <div>
                  <h4 className="text-xl font-semibold text-tomDrkrGreen mb-4 flex items-center justify-center">
                    <Leaf className="w-6 h-6 mr-2 text-tomGreen" />
                    Recommendations
                  </h4>
                  <div
                    className="prose prose-lg max-w-none text-tomDarkGreen text-center"
                    dangerouslySetInnerHTML={{ __html: adviceHtml }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gradient-to-r from-tomRed to-red-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">How it works</h2>
          <p className="text-xl text-tomWhite mb-12">Quick. Clear. Local.</p>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-lg font-semibold mb-2">Select image</h3>
              <p className="text-tomWhite">Choose a clear photo of the affected leaf or plant.</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="text-lg font-semibold mb-2">Describe what you've noticed</h3>
              <p className="text-tomWhite">Add a short note — e.g. 'yellow spots on lower leaves'</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-lg font-semibold mb-2">We process your image</h3>
              <p className="text-tomWhite">Our system analyses your photo and combines it with your notes to generate tailored advice.</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">See results & advice</h3>
              <p className="text-tomWhite">Get a health score, practical treatment steps and prevention tips — in simple language.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews/Testimonials */}
      <section id="reviews" className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-tomDrkrGreen mb-4">What farmers & researchers say</h2>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-tomWhite rounded-xl p-6 border border-tomDarkWhite">
                <div className="text-4xl mb-4">{testimonial.avatar}</div>
                <p className="text-tomDarkGreen mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-tomDrkrGreen">{testimonial.name}</div>
                  <div className="text-sm text-tomDarkGreen">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Blocks */}
      <section className="py-16 px-4 bg-tomWhite">
        <div className="max-w-7xl mx-auto">
          {/* Feature 1 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Farmer photographing plants"
                className="w-full h-80 object-cover"
              />

            </div>
            <div>
              <h3 className="text-3xl font-bold text-tomDrkrGreen mb-4">Easy, everyday use</h3>
              <p className="text-lg text-tomDarkGreen mb-6">
                No jargon. Just upload a photo, and get clear steps you can follow that same day. Works on basic smartphones.
              </p>
              {/* <button className="text-tomRed font-semibold hover:text-tomDarkRed transition-colors">
                Learn more →
              </button> */}
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="order-2 lg:order-1">
              <h3 className="text-3xl font-bold text-tomDrkrGreen mb-4">Research-ready datasets</h3>
              <p className="text-lg text-tomDarkGreen mb-6">
                With farmer consent we curate quality images and results for researchers.
              </p>
              {/* <button className="text-tomRed font-semibold hover:text-tomDarkRed transition-colors">
                Learn more →
              </button> */}
            </div>
            <div className="order-1 lg:order-2 rounded-2xl overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Researcher examining plants"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>

          {/* Feature 3 */}
          {/* <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Community workshop"
                className="w-full h-80 object-cover"
              />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Advice that speaks your language</h3>
              <p className="text-lg text-gray-600 mb-6">
                Recommendations are written simply and translated into Hausa, Yoruba and Igbo. Voice guidance available for low-literacy users.
              </p>
              <button className="text-tomRed font-semibold hover:text-tomDarkRed transition-colors">
                Join a workshop →
              </button>
            </div>
          </div> */}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-tomDrkrGreen text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-tomDarkWhite rounded-lg">
                <button
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-tomWhite transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-tomDrkrGreen">{faq.question}</span>
                  {openFaq === index ? <ChevronUp className="h-5 w-5 text-tomRed" /> : <ChevronDown className="h-5 w-5 text-tomRed" />}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-tomDarkGreen">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review Section */}
      <section className="py-16 px-4 bg-tomWhite">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-tomDrkrGreen mb-8">Rate your experience</h2>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                >
                  <Star className="h-8 w-8 fill-current" />
                </button>
              ))}
            </div>

            <textarea
              className="w-full p-4 rounded-lg border border-tomDarkWhite focus:ring-2 focus:ring-tomRed focus:border-tomRed resize-none mb-6"
              rows={4}
              placeholder="Share how the advice helped (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />

            <button
              onClick={submitFeedback}
              disabled={rating === 0}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${rating === 0
                ? "bg-tomDarkWhite cursor-not-allowed text-tomDrkrGreen"
                : "bg-tomRed hover:bg-tomDarkRed"
                }`}
            >
              Submit feedback
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-tomDrkrGreen text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <img src="frsh_tom_logo.png" alt="Fresh Tomatoes Logo" className="w-36" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <p className="text-tomWhite">hello@freshtomatoes.com</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Links</h3>
              <div className="space-y-2 text-tomWhite text-center">
                <button onClick={() => scrollToSection('home')} className="block hover:text-white transition-colors">Home</button>
                <button onClick={() => scrollToSection('how-it-works')} className="block hover:text-white transition-colors">How it works</button>
                <button onClick={() => scrollToSection('reviews')} className="block hover:text-white transition-colors">Reviews</button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <div className="space-y-2 text-tomWhite">
                <a href="#" className="block hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="block hover:text-white transition-colors">Data Protection</a>
              </div>
            </div>
          </div>

          <div className="border-t border-tomWhite pt-8">
            <p className="text-tomWhite text-sm">
              © 2026 freshtomatoes. All rights reserved.
              {/* Your images help improve local research. */}
            </p>
          </div>
        </div>
      </footer>

      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#CA1B2B',
            color: '#ECEDEB',
          },
          success: {
            style: {
              background: '#19643A',
              color: '#ECEDEB',
            },
          },
          error: {
            style: {
              background: '#CA1B2B',
              color: '#ECEDEB',
            },
          },
        }}
      />
    </div>
  );
};

export default App;
