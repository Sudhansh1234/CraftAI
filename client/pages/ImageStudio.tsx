import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Image as ImageIcon, Info, History, Upload, Download } from "lucide-react";
import { unifiedHistoryService, type ImageHistoryItem } from "@/lib/unifiedHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export default function ImageStudio() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'enhance'>('create');
  const [prompt, setPrompt] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genImageUrl, setGenImageUrl] = useState<string | null>(null);
  const [enhImageUrl, setEnhImageUrl] = useState<string | null>(null);
  const [enhBaseImageUrl, setEnhBaseImageUrl] = useState<string | null>(null);
  const [enhLoading, setEnhLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [settings, setSettings] = useState({ brightness: 1, saturation: 1, hue: 0, blur: 0, sharpen: 0 });
  const [lastApplied, setLastApplied] = useState({ brightness: 1, saturation: 1, hue: 0, blur: 0, sharpen: 0 });
  const [bgSwapLoading, setBgSwapLoading] = useState(false);
  const [bgVariants, setBgVariants] = useState<{ standard?: string; premium?: string; festive?: string }>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<ImageHistoryItem[]>([]);

  // Load image history when component mounts
  useEffect(() => {
    if (currentUser) {
      loadImageHistory();
    }
  }, [currentUser]);

  const loadImageHistory = async () => {
    if (!currentUser) return;
    
    setIsLoadingHistory(true);
    try {
      const history = await unifiedHistoryService.getFeatureHistory(currentUser.uid, 'image-studio', 20);
      setHistoryItems(history);
    } catch (error) {
      console.error('Failed to load image history:', error);
      toast.error('Failed to load image history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenLoading(true);
    setGenImageUrl(null);
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setGenImageUrl(data.imageUrl);
        
        // Save to history
        if (currentUser) {
          try {
            await unifiedHistoryService.saveHistoryItem({
              userId: currentUser.uid,
              feature: 'image-studio',
              type: 'image',
              prompt: prompt,
              imageUrl: data.imageUrl,
              operation: 'generate',
              metadata: {
                sessionId: Date.now().toString(),
              }
            });
            toast.success("Image saved to history");
          } catch (error) {
            console.error('Failed to save image to history:', error);
          }
        }
      }
    } finally {
      setGenLoading(false);
    }
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setEnhBaseImageUrl(dataUrl);
      setLastApplied(settings);
      setEnhLoading(true);
      setEnhImageUrl(null);
      try {
        const res = await fetch('/api/images/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageDataUrl: dataUrl, settings })
        });
        const data = await res.json();
        if (res.ok && data.imageUrl) setEnhImageUrl(data.imageUrl);
      } finally {
        setEnhLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const applySettings = async () => {
    if (!enhBaseImageUrl) return;
    // avoid reapplying same settings
    const same = JSON.stringify(settings) === JSON.stringify(lastApplied);
    if (same) return;
    setEnhLoading(true);
    try {
      const res = await fetch('/api/images/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: enhBaseImageUrl, settings })
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setEnhImageUrl(data.imageUrl);
        setLastApplied(settings);
      }
    } finally {
      setEnhLoading(false);
    }
  };
  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-background py-10">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 gemini-gradient opacity-5"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/80 to-background"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg gemini-gradient flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Image Studio</h1>
                <p className="text-sm text-muted-foreground">Generate product visuals and marketing creatives</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs"
                >
                  <History className="h-4 w-4 mr-2" />
                  {showHistory ? 'Hide History' : 'Show History'}
                </Button>
              )}
              <Badge variant="secondary" className="px-3 py-1 flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </div>
          </div>

          {/* History Panel */}
          {showHistory && currentUser && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Image History
                  {isLoadingHistory && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No image history yet</p>
                    <p className="text-sm">Generate your first image to see it here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {historyItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-3 hover:bg-secondary/50 transition-colors">
                          <div className="space-y-2">
                            <img
                              src={item.imageUrl}
                              alt={item.prompt}
                              className="w-full h-32 object-cover rounded"
                            />
                            <p className="text-sm font-medium line-clamp-2">
                              {item.prompt}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {item.operation}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {item.timestamp.toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPrompt(item.prompt);
                                  setActiveTab('create');
                                }}
                                className="text-xs flex-1"
                              >
                                Reuse Prompt
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = item.imageUrl;
                                  link.download = `image-${item.id}.png`;
                                  link.click();
                                }}
                                className="text-xs"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Button variant={activeTab === 'create' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('create')}>Create Image</Button>
                  <Button variant={activeTab === 'enhance' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('enhance')}>Enhance Image</Button>
                </div>
                <CardTitle className="mt-4">{activeTab === 'create' ? 'Create Images' : 'Enhance Images'}</CardTitle>
                <CardDescription>
                  {activeTab === 'create' ? 'Describe what you want to generate (e.g., "modern handmade bracelet, cool tones, studio setting").' : 'Upload an existing image to enhance (brightness/contrast/sharpness coming soon).'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeTab === 'create' ? (
                  <div className="space-y-4">
                    <Textarea placeholder="e.g., modern handmade bracelet, cool tones, studio setting" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Uses Google Imagen. Make prompts short and specific.</div>
                      <Button onClick={handleGenerate} disabled={genLoading || !prompt.trim()}>
                        {genLoading ? 'Generating…' : 'Generate'}
                      </Button>
                    </div>
                    {genImageUrl && (
                      <div className="mt-2 space-y-2">
                        <img src={genImageUrl} alt="Generated" className="rounded-md border max-h-96" />
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={handleGenerate} disabled={genLoading}>{genLoading ? 'Generating…' : 'Regenerate'}</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Upload an image (JPG/PNG). Enhancements are placeholder for now.</div>
                      <Button onClick={handlePickFile} disabled={enhLoading}>Select Image</Button>
                    </div>
                    {enhBaseImageUrl && (
                      <div className="space-y-3 rounded-md border p-3">
                        <div className="text-sm font-medium">Background Swap Presets</div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" disabled={bgSwapLoading} onClick={async () => {
                            setBgSwapLoading(true);
                            try {
                              const res = await fetch('/api/images/bg-swap', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ imageDataUrl: enhBaseImageUrl, variant: 'standard' })
                              });
                              const data = await res.json();
                              if (res.ok && data.images?.[0]) setBgVariants(v => ({ ...v, standard: data.images[0] }));
                            } finally { setBgSwapLoading(false); }
                          }}>Standard (White)</Button>
                          <Button variant="outline" size="sm" disabled={bgSwapLoading} onClick={async () => {
                            setBgSwapLoading(true);
                            try {
                              const res = await fetch('/api/images/bg-swap', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ imageDataUrl: enhBaseImageUrl, variant: 'premium' })
                              });
                              const data = await res.json();
                              if (res.ok && data.images?.[0]) setBgVariants(v => ({ ...v, premium: data.images[0] }));
                            } finally { setBgSwapLoading(false); }
                          }}>Premium (Shelf)</Button>
                          <Button variant="outline" size="sm" disabled={bgSwapLoading} onClick={async () => {
                            setBgSwapLoading(true);
                            try {
                              const res = await fetch('/api/images/bg-swap', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ imageDataUrl: enhBaseImageUrl, variant: 'festive-diwali' })
                              });
                              const data = await res.json();
                              if (res.ok && data.images?.[0]) setBgVariants(v => ({ ...v, festive: data.images[0] }));
                            } finally { setBgSwapLoading(false); }
                          }}>Festive (Diwali)</Button>
                          <Button variant="outline" size="sm" disabled={bgSwapLoading} onClick={async () => {
                            setBgSwapLoading(true);
                            try {
                              const res = await fetch('/api/images/bg-swap', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ imageDataUrl: enhBaseImageUrl, variant: 'festive-holi' })
                              });
                              const data = await res.json();
                              if (res.ok && data.images?.[0]) setBgVariants(v => ({ ...v, festive: data.images[0] }));
                            } finally { setBgSwapLoading(false); }
                          }}>Festive (Holi)</Button>
                          <Button variant="outline" size="sm" disabled={bgSwapLoading} onClick={async () => {
                            setBgSwapLoading(true);
                            try {
                              const res = await fetch('/api/images/bg-swap', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ imageDataUrl: enhBaseImageUrl, variant: 'festive-christmas' })
                              });
                              const data = await res.json();
                              if (res.ok && data.images?.[0]) setBgVariants(v => ({ ...v, festive: data.images[0] }));
                            } finally { setBgSwapLoading(false); }
                          }}>Festive (Christmas)</Button>
                        </div>
                        {(bgVariants.standard || bgVariants.premium || bgVariants.festive) && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {bgVariants.standard && (
                              <div className="space-y-2">
                                <img src={bgVariants.standard} className="w-full rounded border" />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => setEnhImageUrl(bgVariants.standard!)}>Use</Button>
                                  <Button size="sm" variant="outline" disabled={bgSwapLoading} onClick={async () => {
                                    setBgSwapLoading(true);
                                    try {
                                      const res = await fetch('/api/images/bg-swap', {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ imageDataUrl: enhBaseImageUrl, variant: 'standard' })
                                      });
                                      const data = await res.json();
                                      if (res.ok && data.images?.[0]) setBgVariants(v => ({ ...v, standard: data.images[0] }));
                                    } finally { setBgSwapLoading(false); }
                                  }}>Regenerate</Button>
                                </div>
                              </div>
                            )}
                            {bgVariants.premium && (
                              <div className="space-y-2">
                                <img src={bgVariants.premium} className="w-full rounded border" />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => setEnhImageUrl(bgVariants.premium!)}>Use</Button>
                                  <Button size="sm" variant="outline" disabled={bgSwapLoading} onClick={async () => {
                                    setBgSwapLoading(true);
                                    try {
                                      const res = await fetch('/api/images/bg-swap', {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ imageDataUrl: enhBaseImageUrl, variant: 'premium' })
                                      });
                                      const data = await res.json();
                                      if (res.ok && data.images?.[0]) setBgVariants(v => ({ ...v, premium: data.images[0] }));
                                    } finally { setBgSwapLoading(false); }
                                  }}>Regenerate</Button>
                                </div>
                              </div>
                            )}
                            {bgVariants.festive && (
                              <div className="space-y-2">
                                <img src={bgVariants.festive} className="w-full rounded border" />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => setEnhImageUrl(bgVariants.festive!)}>Use</Button>
                                  <Button size="sm" variant="outline" disabled={bgSwapLoading} onClick={async () => {
                                    setBgSwapLoading(true);
                                    try {
                                      // Regenerate uses the last chosen festive variant key; default to Diwali
                                      const variantKey = 'festive-diwali';
                                      const res = await fetch('/api/images/bg-swap', {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ imageDataUrl: enhBaseImageUrl, variant: variantKey })
                                      });
                                      const data = await res.json();
                                      if (res.ok && data.images?.[0]) setBgVariants(v => ({ ...v, festive: data.images[0] }));
                                    } finally { setBgSwapLoading(false); }
                                  }}>Regenerate</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground">Brightness ({settings.brightness.toFixed(2)})</label>
                        <input type="range" min={0} max={2} step={0.01} value={settings.brightness} onChange={(e) => setSettings(s => ({ ...s, brightness: Number(e.target.value) }))} className="w-full" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Saturation ({settings.saturation.toFixed(2)})</label>
                        <input type="range" min={0} max={2} step={0.01} value={settings.saturation} onChange={(e) => setSettings(s => ({ ...s, saturation: Number(e.target.value) }))} className="w-full" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Hue ({settings.hue}°)</label>
                        <input type="range" min={-180} max={180} step={1} value={settings.hue} onChange={(e) => setSettings(s => ({ ...s, hue: Number(e.target.value) }))} className="w-full" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Blur ({settings.blur.toFixed(2)})</label>
                        <input type="range" min={0} max={10} step={0.1} value={settings.blur} onChange={(e) => setSettings(s => ({ ...s, blur: Number(e.target.value) }))} className="w-full" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Sharpen ({settings.sharpen.toFixed(2)})</label>
                        <input type="range" min={0} max={3} step={0.1} value={settings.sharpen} onChange={(e) => setSettings(s => ({ ...s, sharpen: Number(e.target.value) }))} className="w-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <Button onClick={applySettings} disabled={enhLoading || !enhImageUrl}>{enhLoading ? 'Applying…' : 'Apply Settings'}</Button>
                    </div>
                    {enhImageUrl && (
                      <div className="mt-2">
                        <img src={enhImageUrl} alt="Enhanced" className="rounded-md border max-h-96" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Guidance
                </CardTitle>
                <CardDescription>Tips for better results</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Mention the item clearly (e.g., bracelet, pot, scarf).</li>
                  <li>Add style, color tones, setting, and mood.</li>
                  <li>Prefer short, concrete phrases over long paragraphs.</li>
                  <li>Generate multiple variations and pick the best.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
