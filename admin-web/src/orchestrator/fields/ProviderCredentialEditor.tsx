import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminProviderCredential,
  fetchAdminProviders,
  testAdminProvider,
  testAdminProviderCredential,
  updateAdminProvider,
  updateAdminProviderCredential,
} from '../../api/admin';
import { errorMessage } from '../../api/client';
import { useNodeLibraryStore } from '../dynamicLibrary';
import { CustomProviderForm } from './CustomProviderForm';

function providerKeyTone(status: string): string {
  if (status === 'healthy') return 'bg-emerald-500/15 text-emerald-400';
  if (status === 'degraded') return 'bg-amber-500/15 text-amber-400';
  if (status === 'down') return 'bg-red-500/15 text-red-400';
  return 'bg-line/60 text-faint';
}

const inputBase =
  'min-w-0 flex-1 rounded-lg border border-line bg-ink px-2 py-1 text-[11px] text-inktext outline-none placeholder:text-faint focus:border-blue';

/**
 * Inline provider block for the workflow properties panel: API keys,
 * provider limits (endpoint, max PRM / TPM, priority, enabled) and an
 * optional model selector. All edits hit the real admin API.
 */
export function ProviderCredentialEditor({
  providerName,
  modelValue,
  onModelChange,
  onProviderSelect,
}: {
  providerName: string;
  modelValue?: string;
  onModelChange?: (model: string) => void;
  onProviderSelect?: (provider: string) => void;
}) {
  const queryClient = useQueryClient();
  const reloadLibrary = useNodeLibraryStore((s) => s.reload);
  const [apiKey, setApiKey] = useState('');
  const [rotating, setRotating] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState<{
    baseUrl: string;
    maxRpm: string;
    maxTpm: string;
    priority: string;
    enabled: boolean;
  } | null>(null);

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

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!provider) throw new Error('provider not found');
      if (!draft) return;
      await updateAdminProvider(provider.id, {
        baseUrl: draft.baseUrl.trim(),
        maxRpm: Math.max(1, Number(draft.maxRpm) || 1),
        maxTpm: Math.max(1, Number(draft.maxTpm) || 1),
        priority: Number(draft.priority) || 0,
        enabled: draft.enabled,
      });
    },
    onSuccess: () => {
      setSettingsOpen(false);
      setDraft(null);
      void refresh();
    },
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
  const openSettings = () => {
    setDraft({
      baseUrl: provider.baseUrl,
      maxRpm: String(provider.maxRpm ?? 60),
      maxTpm: String(provider.maxTpm ?? 100000),
      priority: String(provider.priority ?? 0),
      enabled: provider.enabled,
    });
    setSettingsOpen((v) => !v);
  };
  const models = provider.models.filter((m) => m.enabled);

  return (
    <div className="space-y-2 rounded-lg border border-line bg-elevated/60 p-2.5">
      {onProviderSelect && (
        <div className="flex items-center gap-1.5">
          <select
            value={providerName}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setCustomOpen((v) => !v);
                return;
              }
              setCustomOpen(false);
              onProviderSelect(e.target.value);
            }}
            className={inputBase}
          >
            {(providers ?? []).map((p) => (
              <option key={p.id} value={p.name} className="bg-elevated">
                {p.displayName}
                {!p.enabled ? ' (disabled)' : ''}
              </option>
            ))}
            <option value="__custom__" className="bg-elevated">
              ＋ New custom provider…
            </option>
          </select>
        </div>
      )}
      {customOpen && (
        <CustomProviderForm
          capability="text"
          onCreate={(name) => {
            setCustomOpen(false);
            onProviderSelect?.(name);
          }}
        />
      )}
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
            className={inputBase}
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

      {onModelChange && models.length > 0 && (
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">
            Model
          </span>
          <select
            value={String(modelValue ?? '')}
            onChange={(e) => onModelChange(e.target.value)}
            className={inputBase}
          >
            <option value="" className="bg-elevated">— select model —</option>
            {models.map((m) => (
              <option key={m.id} value={m.internalName} className="bg-elevated">
                {m.displayName || m.internalName}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="border-t border-line/60 pt-2">
        <button
          onClick={openSettings}
          className="w-full rounded-md border border-line px-2 py-1 text-[10px] font-medium text-muted hover:bg-line"
        >
          {settingsOpen ? '▴ hide limits' : '▾ limits & endpoint'}
        </button>
        {settingsOpen && draft && (
          <div className="mt-2 space-y-1.5">
            <label className="block">
              <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">
                Endpoint URL
              </span>
              <input
                value={draft.baseUrl}
                onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
                className={inputBase}
              />
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <label className="block">
                <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">
                  Max PRM
                </span>
                <input
                  type="number"
                  min={1}
                  value={draft.maxRpm}
                  onChange={(e) => setDraft({ ...draft, maxRpm: e.target.value })}
                  className={inputBase}
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">
                  Max TPM
                </span>
                <input
                  type="number"
                  min={1}
                  value={draft.maxTpm}
                  onChange={(e) => setDraft({ ...draft, maxTpm: e.target.value })}
                  className={inputBase}
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">
                  Priority
                </span>
                <input
                  type="number"
                  value={draft.priority}
                  onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                  className={inputBase}
                />
              </label>
            </div>
            <label className="flex items-center justify-between pt-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-faint">
                Provider enabled
              </span>
              <button
                onClick={() => setDraft({ ...draft, enabled: !draft.enabled })}
                className={`relative h-4.5 w-8 rounded-full transition-colors ${draft.enabled ? 'bg-blue-500' : 'bg-line'}`}
              >
                <span
                  className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all ${draft.enabled ? 'left-[16px]' : 'left-0.5'}`}
                />
              </button>
            </label>
            <button
              onClick={() => saveSettings.mutate()}
              disabled={saveSettings.isPending}
              className="w-full rounded-lg bg-blue-500 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-400 disabled:opacity-40"
            >
              {saveSettings.isPending ? 'saving…' : 'Save limits'}
            </button>
            {saveSettings.isError && (
              <p className="text-[10px] text-red-400">{errorMessage(saveSettings.error)}</p>
            )}
          </div>
        )}
      </div>

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
