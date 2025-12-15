import './globals.css';

export const metadata = {
  title: 'Chat com PDF',
  description: 'Interaja com seus PDFs usando uma LLM local',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
