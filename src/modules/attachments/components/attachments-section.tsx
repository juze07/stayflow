import { FileText, ImageIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { MAX_ATTACHMENTS_PER_ITEM, isPreviewableImage, type AttachmentParent } from "../constants";
import { listAttachments } from "../queries";
import { AttachmentUploader } from "./attachment-uploader";
import { DeleteAttachmentButton } from "./delete-attachment-button";

type AttachmentsSectionProps = {
  businessId: string;
  timeZone: string;
  parent: AttachmentParent;
  title: string;
  description?: string;
  /** Quem pode enviar ficheiros (a regra real está na base de dados). */
  canUpload: boolean;
  /** Gestores apagam qualquer ficheiro; os restantes, só os que enviaram. */
  canManage: boolean;
  userId: string;
  receipts?: boolean;
};

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Fotografias ou comprovativos de uma entidade, com envio a partir do telemóvel. */
export async function AttachmentsSection({
  businessId,
  timeZone,
  parent,
  title,
  description,
  canUpload,
  canManage,
  userId,
  receipts,
}: AttachmentsSectionProps) {
  const attachments = await listAttachments(businessId, parent);
  const remaining = MAX_ATTACHMENTS_PER_ITEM - attachments.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {receipts ? "Sem comprovativos anexados." : "Sem fotografias."}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {attachments.map((attachment) => {
              const name = attachment.fileName ?? (receipts ? "Comprovativo" : "Fotografia");
              const canDelete = canManage || attachment.createdBy === userId;
              const preview = attachment.url && isPreviewableImage(attachment.mimeType);
              const Icon = attachment.mimeType === "application/pdf" ? FileText : ImageIcon;
              return (
                <li key={attachment.id} className="group relative">
                  <a
                    href={attachment.url ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-lg border border-border bg-muted/40"
                  >
                    {preview ? (
                      // Endereço assinado e temporário: o otimizador de imagens não se aplica.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachment.url!}
                        alt={name}
                        loading="lazy"
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <span className="flex aspect-square w-full flex-col items-center justify-center gap-2 p-2 text-center">
                        <Icon className="size-8 text-muted-foreground" aria-hidden />
                        <span className="line-clamp-2 text-xs break-all text-foreground">{name}</span>
                      </span>
                    )}
                  </a>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {formatDateTime(attachment.createdAt, timeZone)} · {formatSize(attachment.sizeBytes)}
                  </p>
                  {canDelete && (
                    <div className="absolute top-1.5 right-1.5">
                      <DeleteAttachmentButton attachmentId={attachment.id} name={name} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {canUpload && (
          <AttachmentUploader
            businessId={businessId}
            parent={parent}
            allowPdf={receipts}
            label={receipts ? "Anexar comprovativo" : "Adicionar fotografias"}
            remaining={remaining}
          />
        )}
      </CardContent>
    </Card>
  );
}
