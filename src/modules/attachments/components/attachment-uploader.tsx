"use client";

import { Camera, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { registerAttachmentAction } from "../actions";
import {
  ATTACHMENTS_BUCKET,
  MAX_ATTACHMENT_BYTES,
  attachmentExtension,
  attachmentFolder,
  isAttachmentMimeType,
  type AttachmentMimeType,
  type AttachmentParent,
} from "../constants";

type AttachmentUploaderProps = {
  businessId: string;
  parent: AttachmentParent;
  /** Recibos aceitam PDF; fotografias só imagens. */
  allowPdf?: boolean;
  label: string;
  remaining: number;
};

/** Alguns browsers não indicam o tipo de ficheiros HEIC; usa a extensão. */
function detectMime(file: File): AttachmentMimeType | null {
  if (isAttachmentMimeType(file.type)) return file.type;
  if (/\.hei[cf]$/i.test(file.name)) return "image/heic";
  return null;
}

/**
 * Envia ficheiros diretamente do browser para o Storage privado (na pasta da
 * empresa, protegida por RLS) e depois regista-os no servidor.
 */
export function AttachmentUploader({ businessId, parent, allowPdf, label, remaining }: AttachmentUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function upload(files: File[]) {
    const supabase = createClient();
    for (const [index, file] of files.entries()) {
      setProgress(files.length > 1 ? `A enviar ${index + 1} de ${files.length}…` : "A enviar…");
      const mime = detectMime(file);
      if (!mime || (!allowPdf && mime === "application/pdf")) {
        return `"${file.name}": formato não suportado. Use ${allowPdf ? "JPG, PNG, WEBP, HEIC ou PDF" : "JPG, PNG, WEBP ou HEIC"}.`;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) return `"${file.name}" tem mais de 10 MB.`;

      const path = `${attachmentFolder(businessId, parent)}${crypto.randomUUID()}.${attachmentExtension(mime)}`;
      const { error: uploadError } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .upload(path, file, { contentType: mime, upsert: false });
      if (uploadError) {
        console.error("upload failed", uploadError);
        return `Não foi possível enviar "${file.name}". Verifique a ligação e tente novamente.`;
      }

      const result = await registerAttachmentAction({
        parentType: parent.type,
        parentId: parent.id,
        storagePath: path,
        fileName: file.name.slice(0, 255),
        mimeType: mime,
        sizeBytes: file.size,
      });
      if (!result.ok) return result.error;
    }
    return null;
  }

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setError(null);
    if (files.length > remaining) {
      setError(`Pode anexar no máximo mais ${remaining} ficheiro${remaining === 1 ? "" : "s"}.`);
      return;
    }
    startTransition(async () => {
      const message = await upload(files);
      setProgress(null);
      if (message) setError(message);
      router.refresh();
    });
  }

  const Icon = allowPdf ? Paperclip : Camera;
  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={allowPdf ? "image/*,.heic,application/pdf" : "image/*,.heic"}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onChange}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={isPending}
        disabled={remaining <= 0}
        onClick={() => inputRef.current?.click()}
      >
        {!isPending && <Icon aria-hidden />}
        {isPending ? (progress ?? "A enviar…") : label}
      </Button>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
