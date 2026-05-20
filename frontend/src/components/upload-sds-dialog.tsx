import { useRef, useState, type ReactNode } from "react";
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  Loader2,
  CircleAlert,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UploadSdsDialog({
  trigger,
  onSuccess,
}: {
  trigger: ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const analyze = useMutation({
    mutationFn: async (f: File) => {
      const formData = new FormData();
      formData.append("file", f);

      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || "Failed to analyse PDF");
      }

      return res.json() as Promise<{ document_id: number }>;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      onSuccess?.();
      setOpen(false);
      reset();
      navigate({ to: "/sds/$id", params: { id: String(res.document_id) } });
    },
    onError: (e: Error) => {
      setErrorMsg(e.message);
    },
  });

  const reset = () => {
    setFile(null);
    setDragOver(false);
    setErrorMsg(null);
  };

  const onAnalyse = () => {
    if (!file) return;
    setErrorMsg(null);
    analyze.mutate(file);
  };

  const submitting = analyze.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (submitting) return;
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="p-0 sm:max-w-lg">
        <div className="flex flex-col">
          {/* Header */}
          <div className="px-6 pt-6">
            <DialogHeader>
              <DialogTitle>Upload SDS Sheet</DialogTitle>
              <DialogDescription>
                Select a PDF and click <strong>Upload &amp; Analyse</strong> —
                we'll extract all the safety data and take you straight to the
                details page.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {submitting ? (
              <ProcessingPanel fileName={file?.name ?? "document.pdf"} />
            ) : (
              <>
                {/* Drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) setFile(f);
                  }}
                  className={cn(
                    "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary/40",
                  )}
                >
                  {!file ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Drag &amp; drop your SDS file here
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF up to 20 MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => inputRef.current?.click()}
                      >
                        Browse files
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg bg-background p-3 text-left ring-1 ring-border">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB · ready to
                          analyse
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setFile(null)}
                        aria-label="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFile(f);
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Error */}
                {errorMsg && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2 border-t bg-background px-6 py-4 sm:gap-2">
            {submitting ? (
              <Button disabled className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={onAnalyse}
                  disabled={!file}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Upload &amp; Analyse
                </Button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Processing panel ─────────────────────────────────────────────────────────

const PROCESSING_STEPS = [
  "Parsing PDF structure",
  "Identifying SDS sections",
  "Extracting key fields",
  "Saving to database",
];

function ProcessingPanel({ fileName }: { fileName: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-secondary/30 px-6 py-10 text-center">
      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <Loader2 className="absolute -right-1 -top-1 h-5 w-5 animate-spin text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">Analysing {fileName}</p>
        <p className="text-xs text-muted-foreground">
          Extracting hazards, pictograms, composition and regulatory data…
        </p>
      </div>
      <div className="mt-2 grid w-full max-w-xs gap-2 text-left">
        {PROCESSING_STEPS.map((t) => (
          <div
            key={t}
            className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-xs ring-1 ring-border"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}