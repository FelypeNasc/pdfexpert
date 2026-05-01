export function TypingSkeleton() {
  return (
    <div className="flex justify-start">
      <div className="p-3 rounded-lg max-w-xs bg-zinc-200 text-zinc-900 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
      </div>
    </div>
  );
}
