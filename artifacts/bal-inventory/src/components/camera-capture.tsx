import { useRef, useState, useCallback } from "react";
import { Camera, Upload, X, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("camera");

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError("Camera access denied. Use the file upload tab instead.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const takeSnapshot = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setCapturedImage(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (tab !== "camera") stopCamera();
    setCapturedImage(null);
    setCameraError(null);
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      {capturedImage ? (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img src={capturedImage} alt="Captured" className="w-full max-h-72 object-contain bg-black" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={retake} size="sm">
              <RotateCcw className="w-4 h-4 mr-2" /> Retake
            </Button>
            <Button onClick={confirmCapture} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Check className="w-4 h-4 mr-2" /> Use This Photo
            </Button>
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="camera" className="flex-1">
              <Camera className="w-4 h-4 mr-2" /> Camera
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">
              <Upload className="w-4 h-4 mr-2" /> Upload File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-3 mt-3">
            {cameraError && (
              <p className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-lg">{cameraError}</p>
            )}
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: 200 }}>
              <video
                ref={videoRef}
                className="w-full max-h-64 object-cover"
                playsInline
                muted
                style={{ display: cameraActive ? "block" : "none" }}
              />
              {!cameraActive && !cameraError && (
                <div className="flex items-center justify-center h-48">
                  <Camera className="w-10 h-10 text-muted-foreground opacity-40" />
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Mobile-friendly file input with camera capture */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex gap-2 justify-center">
              {!cameraActive ? (
                <>
                  <Button onClick={startCamera} variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-2" /> Open Camera
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" /> Take Photo (Mobile)
                  </Button>
                </>
              ) : (
                <Button onClick={takeSnapshot} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Camera className="w-4 h-4 mr-2" /> Capture
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-3 mt-3">
            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to select an image</span>
              <span className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WEBP up to 10MB</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </TabsContent>
        </Tabs>
      )}

      <div className="flex justify-start">
        <Button variant="ghost" size="sm" onClick={() => { stopCamera(); onCancel(); }}>
          <X className="w-4 h-4 mr-2" /> Cancel
        </Button>
      </div>
    </div>
  );
}
