import {
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from "@assistant-ui/core";
import type { Attachment, PendingAttachment, CompleteAttachment } from "@assistant-ui/core";

const generateId = () => Math.random().toString(36).slice(2, 9);
const getFileDataURL = async (file: File): Promise<string> => {
  if (typeof FileReader === "undefined") {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:${file.type || "application/octet-stream"};base64,${typeof btoa !== "undefined" ? btoa(binary) : ""}`;
  }
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = (e) => reject(e);
    r.readAsDataURL(file);
  });
};

class DocumentFileAdapter {
  public accept =
    "application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/vnd.ms-excel,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,application/vnd.ms-powerpoint,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx";

  public async add(state: { file: File }): Promise<PendingAttachment> {
    return {
      id: generateId(),
      type: "document",
      name: state.file.name,
      contentType: state.file.type || "application/octet-stream",
      file: state.file,
      status: { type: "requires-action", reason: "composer-send" },
    };
  }
  public async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
    return {
      ...attachment,
      status: { type: "complete" },
      content: [
        {
          type: "file",
          mimeType: attachment.contentType || "application/octet-stream",
          filename: attachment.name,
          data: await getFileDataURL(attachment.file),
        } as any,
      ],
    };
  }
  public async remove(_attachment: Attachment) {}
}

class ExtendedTextAdapter extends SimpleTextAttachmentAdapter {
  public override accept =
    "text/plain,text/html,text/markdown,text/csv,text/xml,text/json,application/json,.txt,.csv,.json,.md,application/csv,text/tab-separated-values";
}

export const attachmentAdapter = new CompositeAttachmentAdapter([
  new SimpleImageAttachmentAdapter(),
  new ExtendedTextAdapter(),
  new DocumentFileAdapter() as any,
]);
