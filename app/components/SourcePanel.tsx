import type { Source } from '@/libs/chatStorage';

type SourcePanelProps = {
  source: Source;
  onClose: () => void;
};

export function SourcePanel({ source, onClose }: SourcePanelProps) {
  const pageNumber = (source.metadata?.loc as Record<string, unknown>)?.pageNumber;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 bg-zinc-900 text-white shadow-xl flex flex-col transform transition-transform duration-200 ease-in-out">
      <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
        <h3 className="font-bold text-sm">
          Fonte [{source.index}]
          {pageNumber != null && ` — Página ${pageNumber}`}
        </h3>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white text-lg"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {source.content}
        </p>
      </div>
    </div>
  );
}
