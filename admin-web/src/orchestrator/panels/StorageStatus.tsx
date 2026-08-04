import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { testStorageProvider } from '../../api/admin';
import { errorMessage } from '../../api/client';
import { useNodeLibraryStore } from '../dynamicLibrary';

/**
 * Inline storage-provider status block for the storageNode properties panel —
 * shows which backend the node will write to and tests the connection.
 */
export function StorageStatus({ storageName }: { storageName: string }) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const providers = useNodeLibraryStore((s) => s.storageProviders);
  const provider = providers.find((p) => p.name === storageName);

  const runTest = useMutation({
    mutationFn: async () => {
      if (!provider) throw new Error('storage provider not found');
      const res = await testStorageProvider(provider.id);
      return { ok: res.ok, message: res.message };
    },
    onSuccess: (res) => setResult(res),
    onError: (err) => setResult({ ok: false, message: errorMessage(err) }),
  });

  if (!provider) {
    return (
      <div className="rounded-lg border border-dashed border-line px-3 py-2 text-[11px] text-faint">
        Storage “{storageName}” not found — the local driver will be used by default.
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-line bg-elevated/60 p-2.5">
      <div className="flex items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-inktext">
          {provider.name}
        </span>
        <span className="rounded bg-blue-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase text-blue-400">
          {provider.driver}
        </span>
        {provider.isActive && (
          <span className="rounded bg-emerald-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase text-emerald-400">
            active
          </span>
        )}
        <span className="rounded bg-line/60 px-1 py-0.5 text-[9px] text-faint">
          prio {provider.priority}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-faint">
        {provider.configConfigured ? (
          <span className="flex-1 truncate text-emerald-400">✓ config set</span>
        ) : (
          <span className="flex-1 truncate text-amber-400">
            ⚠ no config — writes may fall back to defaults
          </span>
        )}
        <button
          onClick={() => {
            setResult(null);
            runTest.mutate();
          }}
          disabled={runTest.isPending}
          className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted hover:bg-line disabled:opacity-40"
        >
          {runTest.isPending ? '…' : 'Test'}
        </button>
      </div>
      {result && (
        <p className={`text-[10px] ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {result.ok ? '✓ ' : '✗ '}
          {result.message}
        </p>
      )}
      <p className="text-[9px] leading-relaxed text-faint">
        Configure or re-activate backends on the Storage → Providers admin page; this node can
        target any provider by name.
      </p>
    </div>
  );
}
