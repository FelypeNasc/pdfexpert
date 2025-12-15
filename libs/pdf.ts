import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export async function extractTextFromPDF(buffer: Buffer) {
  const blob = new Blob([buffer], { type: "application/pdf" });

  const loader = new PDFLoader(blob, {
    splitPages: false,
  });

  const docs = await loader.load();
  return docs.map((doc) => doc.pageContent).join("\n");
}
