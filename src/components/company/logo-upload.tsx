"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  companyId: string;
  currentLogo: string | null;
  onLogoChange?: (logo: string | null) => void;
}

export function LogoUpload({ companyId, currentLogo, onLogoChange }: LogoUploadProps) {
  const [logo, setLogo] = useState<string | null>(currentLogo);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch(`/api/companies/${companyId}/logo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao fazer upload");
      }

      const data = await response.json();
      setLogo(data.logo);
      onLogoChange?.(data.logo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    setError(null);
    setUploading(true);

    try {
      const response = await fetch(`/api/companies/${companyId}/logo`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao remover logo");
      }

      setLogo(null);
      onLogoChange?.(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium block">Logo da Empresa</label>

      <div className="flex items-start gap-4">
        <div
          className={cn(
            "relative flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed bg-muted/50 overflow-hidden",
            !logo && "cursor-pointer hover:bg-muted/80 transition-colors"
          )}
          onClick={() => !logo && !uploading && inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : logo ? (
            <Image src={logo} alt="Logo" fill className="object-contain p-1" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            onChange={handleUpload}
            className="hidden"
          />

          {logo ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Trocar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Enviar logo
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP ou SVG. Máximo 2MB.
          </p>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
