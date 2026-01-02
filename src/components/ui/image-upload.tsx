import { useState, useRef, useCallback } from "react";
import { Camera, X, Upload, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (value: string | null) => void;
  className?: string;
  variant?: "avatar" | "document";
  label?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  className,
  variant = "document",
  label,
  maxSizeMB = 5,
  disabled = false,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (file: File | null) => {
      setError(null);

      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar");
        return;
      }

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setError(`Ukuran file maksimal ${maxSizeMB}MB`);
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [maxSizeMB, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0] || null;
    handleFileChange(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  if (variant === "avatar") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <div
          className={cn(
            "relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed transition-all cursor-pointer",
            isDragging ? "border-primary bg-primary/10" : "border-border",
            disabled && "opacity-50 cursor-not-allowed",
            !value && "bg-muted"
          )}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {value ? (
            <>
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="absolute top-0 right-0 p-1 bg-destructive text-destructive-foreground rounded-full transform translate-x-1/4 -translate-y-1/4"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>
        {label && (
          <span className="text-sm text-muted-foreground">{label}</span>
        )}
        {error && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all cursor-pointer",
          isDragging ? "border-primary bg-primary/10" : "border-border",
          disabled && "opacity-50 cursor-not-allowed",
          !value && "bg-muted/50"
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="relative aspect-[4/3] w-full">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-contain rounded-lg p-2"
            />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Klik atau seret gambar
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG (Maks. {maxSizeMB}MB)
            </p>
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
