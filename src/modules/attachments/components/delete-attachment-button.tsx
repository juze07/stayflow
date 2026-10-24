"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteAttachmentAction } from "../actions";

export function DeleteAttachmentButton({ attachmentId, name }: { attachmentId: string; name: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <ConfirmDialog
        trigger={
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-md bg-surface/90 text-destructive shadow-sm hover:bg-surface"
            aria-label={`Apagar ${name}`}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        }
        title="Apagar ficheiro?"
        description={`"${name}" é apagado definitivamente.`}
        confirmLabel="Apagar"
        onConfirm={async () => {
          setError(null);
          const result = await deleteAttachmentAction(attachmentId);
          if (!result.ok) setError(result.error);
          else router.refresh();
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </>
  );
}
