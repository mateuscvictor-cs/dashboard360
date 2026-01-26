"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, User, ArrowRight, ArrowLeft, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhotoStepProps {
  name: string;
  image: string | null;
  onImageChange: (image: string | null) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function PhotoStep({ name, image, onImageChange, onNext, onBack, onSkip }: PhotoStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInitials = (userName: string) => {
    return userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileChange = (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Selecione apenas arquivos de imagem");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onImageChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeImage = () => {
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold"
        >
          Adicione sua foto
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-muted-foreground"
        >
          Uma foto ajuda a personalizar sua experiência
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <div className="relative">
          {image ? (
            <div className="relative">
              <motion.img
                src={image}
                alt="Avatar preview"
                className="h-32 w-32 rounded-full object-cover border-4 border-background shadow-xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              />
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={removeImage}
                className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          ) : (
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-4 border-background shadow-xl">
              {name ? getInitials(name) : <User className="h-12 w-12" />}
            </div>
          )}
          
          {!image && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Camera className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50",
          image && "opacity-50"
        )}
        onClick={() => !image && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
            isDragging ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {isDragging ? "Solte a imagem aqui" : "Arraste uma imagem ou clique"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG ou GIF (máx. 2MB)
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive text-center"
        >
          {error}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl bg-muted/50 p-4 flex items-start gap-3"
      >
        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Dica</p>
          <p className="text-muted-foreground mt-0.5">
            Uma foto de rosto ajuda sua equipe a reconhecê-lo mais facilmente nas interações.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="flex-1 h-12 rounded-xl gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button
            onClick={onNext}
            size="lg"
            className="flex-1 h-12 rounded-xl bg-gradient-brand text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all gap-2"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          onClick={onSkip}
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
        >
          Pular esta etapa
        </Button>
      </motion.div>
    </motion.div>
  );
}
