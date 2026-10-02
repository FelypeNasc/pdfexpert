import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";

export async function extractTextFromPDF(buffer: Buffer) {
  const blob = new Blob([buffer], { type: "application/pdf" });

  const loader = new PDFLoader(blob, {
    splitPages: true,
  });

  const docs = await loader.load();
  return {
    text: docs.map((doc) => doc.pageContent).join("\n"),
    pageCount: docs.length,
  };
}

export async function extractTextFromDocx(buffer: Buffer) {
  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const loader = new DocxLoader(blob);
  const docs = await loader.load();
  return {
    text: docs.map((doc) => doc.pageContent).join("\n"),
    pageCount: 1,
  };
}

export async function extractTextFromTxt(buffer: Buffer) {
  return {
    text: buffer.toString("utf-8"),
    pageCount: 1,
  };
}

export async function extractText(buffer: Buffer, filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return extractTextFromPDF(buffer);
  if (ext === "docx") return extractTextFromDocx(buffer);
  if (ext === "txt" || ext === "md") return extractTextFromTxt(buffer);
  throw new Error(`Unsupported file type: .${ext}`);
}
