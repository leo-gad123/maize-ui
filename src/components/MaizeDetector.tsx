import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Upload, X, Loader2, ScanSearch, RefreshCw, CheckCircle2, AlertCircle, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API_URL = "https://volitionally-semibiological-ambrose.ngrok-free.dev/predict";

type Prediction = { class: string; confidence: number };

export const MaizeDetector = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setResult(null);
      // wait for ref
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      toast.error("Camera permission denied or unavailable");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      handleFile(file);
      stopCamera();
    }, "image/jpeg", 0.92);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
  };

  const predict = async () => {
    if (!imageFile) {
      toast.error("Please select or capture an image first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data: Prediction = await res.json();
      setResult(data);
      toast.success("Analysis complete");
    } catch (err) {
      toast.error("Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <header className="text-center mb-8 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-glow mb-4">
          <Leaf className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
          🌽 Maize Disease Detector
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          AI-Powered Crop Health Analysis
        </p>
      </header>

      <Card className="bg-gradient-card shadow-elegant border-border/60 rounded-3xl p-6 sm:p-8 animate-fade-in-up">
        {/* Camera View */}
        {cameraActive && (
          <div className="space-y-4 animate-scale-in">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] shadow-soft">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute inset-6 border-2 border-primary-foreground/70 rounded-xl pointer-events-none" />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-destructive/90 text-destructive-foreground text-xs font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" />
                LIVE
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={capturePhoto} size="lg" className="flex-1 bg-gradient-primary hover:opacity-90 transition-smooth shadow-soft">
                <Camera className="mr-2 h-5 w-5" /> Capture
              </Button>
              <Button onClick={stopCamera} size="lg" variant="outline" className="flex-1">
                <X className="mr-2 h-5 w-5" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {!cameraActive && imagePreview && (
          <div className="space-y-4 animate-scale-in">
            <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[4/3] shadow-soft group">
              <img src={imagePreview} alt="Selected leaf" className="w-full h-full object-cover" />
              <button
                onClick={removeImage}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/90 backdrop-blur hover:bg-destructive hover:text-destructive-foreground transition-smooth flex items-center justify-center shadow-soft"
                aria-label="Remove image"
              >
                <X className="h-5 w-5" />
              </button>
              {loading && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-ring">
                    <Loader2 className="h-7 w-7 text-primary-foreground animate-spin" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Analyzing leaf...</p>
                </div>
              )}
            </div>
            <Button
              onClick={predict}
              disabled={loading}
              size="lg"
              className="w-full bg-gradient-primary hover:opacity-90 transition-smooth shadow-soft text-base h-12"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
              ) : (
                <><ScanSearch className="mr-2 h-5 w-5" /> 🔬 Predict Disease</>
              )}
            </Button>
          </div>
        )}

        {/* Upload Options */}
        {!cameraActive && !imagePreview && (
          <div className="space-y-4 animate-fade-in-up">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-smooth",
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/60 hover:bg-secondary/40"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">
                Drop your image here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse · PNG, JPG up to 10MB
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              onClick={startCamera}
              variant="outline"
              size="lg"
              className="w-full h-12 border-2 hover:bg-secondary hover:border-primary/60 transition-smooth"
            >
              <Camera className="mr-2 h-5 w-5" /> Use Camera
            </Button>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="mt-6 animate-scale-in">
            <Card className="border-success/30 bg-success/5 rounded-2xl p-5 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Detection Result
                  </p>
                  <h3 className="text-xl font-bold text-foreground mb-3 break-words">
                    {result.class}
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-semibold text-foreground">{confidencePct}%</span>
                    </div>
                    <Progress value={confidencePct} className="h-2.5" />
                  </div>
                </div>
              </div>
              <Button
                onClick={removeImage}
                variant="ghost"
                size="sm"
                className="w-full mt-4 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Analyze another image
              </Button>
            </Card>
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1.5">
        <AlertCircle className="h-3 w-3" />
        For best results, capture a clear photo of a single maize leaf
      </p>
    </div>
  );
};
