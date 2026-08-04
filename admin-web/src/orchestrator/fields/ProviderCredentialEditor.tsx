import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminProviderCredential,
  fetchAdminProviders,
  testAdminProvider,
  testAdminProviderCredential,
  updateAdminProviderCredential,
} from '../../api/admin';
import { errorMessage } from '../../api/client';
import { useNodeLibraryStore } from '../dynamicLibrary';

function providerKeyTone(status: string): string {
  if (status === 'healthy') return 'bg-emerald-500/15 text-emerald-400';
  if (status === 'degraded') return 'bg-amber-500/15 text-amber-400';
  if (status === 'down') return 'bg-red-500/15 text-red-400';
  return 'bg-line/60 text-faint';
}

/**
 * Inline provider credential block for the workflow properties panel.
 * Lets you add / rotate an API key and test the connection without
 * leaving the builder.
 */
export function ProviderCredentialEditor({ providerName }: { providerName: string }) {
  const queryClient = useQueryClient();
  const reloadLibrary = useNodeLibraryStore((s) => s.reload);
  const [apiKey, setApiKey] = useState('');
  const [rotating, setRotating] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { data: providers, isLoading } = useQuery({
    queryKey: ['admin', 'providers'],
    queryFn: fetchAdminProviders,
  });

  const provider = (providers ?? []).find(
    (p) => p.name === providerName || p.displayName === providerName,
  );

  const refresh = async () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
    await reloadLibrary();
  };

  const saveKey = useMutation({
    mutationFn: async () => {
      if (!provider) throw new Error('provider not found');
      if (!apiKey.trim()) throw new Error('API key is required');
      await createAdminProviderCredential(provider.id, {
        label: 'builder',
        apiKey: apiKey.trim(),
        priority: 0,
      });
    },
    onSuccess: () => {
      setApiKey('');
      void refresh();
    },
  });

  const rotateKey = useMutation({
    mutationFn: async () => {
      if (!provider) throw new Error('provider not found');
      if (!apiKey.trim()) throw new Error('API key is required');
      const target = provider.credentials.find((c) => c.enabled) ?? provider.credentials[0];
      if (target) {
        await updateAdminProviderCredential(provider.id, target.id, { apiKey: apiKey.trim() });
      } else {
        await createAdminProviderCredential(provider.id, {
          label: 'builder',
          apiKey: apiKey.trim(),
          priority: 0,
        });
      }
    },
    onSuccess: () => {
      setApiKey('');
      setRotating(false);
      void refresh();
    },
  });

  const runTest = useMutation({
    mutationFn: async () => {
      if (!provider) throw new Error('provider not found');
      const target = provider.credentials.find((c) => c.enabled) ?? provider.credentials[0];
      if (target) {
        return testAdminProviderCredential(provider.id, target.id);
      }
      return testAdminProvider(provider.id);
    },
    onSuccess: (result) => setTestResult({ ok: result.ok, message: result.message }),
    onError: (err) => setTestResult({ ok: false, message: errorMessage(err) }),
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-line bg-elevated px-3 py-2 text-[11px] text-faint">
        loading provider… ({providerName})
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="rounded-lg border border-dashed border-line px-3 py-2 text-[11px] text-faint">
        Provider “{providerName}” not found — add it under Admin → Providers, then pick it here.
      </div>
    );
  }

  const keyed = provider.apiKeyConfigured || provider.credentials.some((c) => c.enabled);
  const primaryMasked =
    provider.credentials.find((c) => c.enabled)?.apiKeyMasked ??
    provider.credentials[0]?.apiKeyMasked ??
    provider.apiKeyMasked;
  const busy = saveKey.isPending || rotateKey.isPending;

  return (
    <div className="space-y-2 rounded-lg border border-line bg-elevated/60 p-2.5">
      <div className="flex items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-inktext">
          {provider.displayName}
        </span>
        <span className="text-[9px] text-faint">{provider.name}</span>
        {provider.enabled ? (
          <span className="rounded bg-emerald-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase text-emerald-400">on</span>
        ) : (
          <span className="rounded bg-red-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase text-red-400">off</span>
        )}
        <span className={`rounded px-1 py-0.5 text-[9px] font-semibold uppercase ${providerKeyTone(provider.healthStatus)}`}>
          {provider.healthStatus}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-faint">
        {keyed ? (
          <span className="flex-1 truncate">
            <span className="text-emerald-400">✓</span> key {primaryMasked ?? 'set'}
          </span>
        ) : (
          <span className="flex-1 truncate">
            <span className="text-amber-400">⚠</span> no API key — model calls will fail
          </span>
        )}
        <button
          onClick={() => setRotating((v) => !v)}
          className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted hover:bg-line"
        >
          {keyed ? 'Rotate' : 'Add key'}
        </button>
        <button
          onClick={() => {
            setTestResult(null);
            runTest.mutate();
          }}
          disabled={runTest.isPending}
          className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted hover:bg-line disabled:opacity-40"
        >
          {runTest.isPending ? '…' : 'Test'}
        </button>
      </div>

      {(rotating || !keyed) && (
        <div className="flex items-center gap-1.5">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-…"
            className="min-w-0 flex-1 rounded-lg border border-line bg-ink px-2 py-1 text-[11px] text-inktext outline-none placeholder:text-faint focus:border-blue"
          />
          <button
            onClick={() => (keyed ? rotateKey.mutate() : saveKey.mutate())}
            disabled={busy || !apiKey.trim()}
            className="shrink-0 rounded-lg bg-blue-500 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-400 disabled:opacity-40"
          >
            {busy ? '…' : keyed ? 'Rotate' : 'Save'}
          </button>
        </div>
      )}

      {(saveKey.isError || rotateKey.isError) && (
        <p className="text-[10px] text-red-400">
          {saveKey.isError ? errorMessage(saveKey.error) : errorMessage(rotateKey.error)}
        </p>
      )}

      {testResult && (
        <p className={`text-[10px] ${testResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {testResult.ok ? '✓ ' : '✗ '}
          {testResult.message}
        </p>
      )}
    </div>
  );
}
