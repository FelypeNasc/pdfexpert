import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

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
