import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createStorageProvider,
  deleteStorageAsset,
  deleteStorageProvider,
  fetchStorageAssetFile,
  fetchStorageAssets,
  fetchStorageProviders,
  testStorageProvider,
  updateStorageProvider,
} from '../api/admin';
import { errorMessage } from '../api/client';
import type {
  StorageAsset,
  StorageDriver,
  StorageProvider,
} from '../api/types';
import {
  ActionButton,
  Badge,
  ConfirmDialog,
  ErrorBlock,
  formatDate,
  InlineMessage,
  LoadingBlock,
  Modal,
  Toggle,
} from '../components/ui';

const assetsKey = ['admin', 'storage', 'assets'] as const;
const providersKey = ['admin', 'storage', 'providers'] as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function AssetThumb({ asset }: { asset: StorageAsset }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    if (asset.kind !== 'image' || asset.mime?.startsWith('image/') === false) {
      return;
    }
    fetchStorageAssetFile(asset.id)
      .then(({ blob }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [asset.id, asset.kind, asset.mime]);

  if (asset.kind === 'video') {
    return (
      <div className="flex h-28 w-full items-center justify-center bg-ink text-2xl text-cyan">
        🎬
      </div>
    );
  }
  if (url) {
    return <img src={url} alt={asset.tool} className="h-28 w-full object-cover" />;
  }
  if (failed) {
    return (
      <div className="flex h-28 w-full items-center justify-center bg-ink text-[11px] text-faint">
        preview unavailable
      </div>
    );
  }
  return <div className="flex h-28 w-full items-center justify-center bg-ink text-[11px] text-faint">…</div>;
}

function AssetsTab() {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<StorageAsset | null>(null);

  const assets = useQuery({
    queryKey: assetsKey,
    queryFn: () => fetchStorageAssets(200, 0),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteStorageAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetsKey });
      setDeleting(null);
    },
    onError: () => setDeleting(null),
  });

  if (assets.isPending) return <LoadingBlock label="Loading assets…" />;
  if (assets.isError)
    return <ErrorBlock message="Failed to load storage assets" onRetry={() => assets.refetch()} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Assets persisted by storage nodes. Local driver by default — configure providers in the
          Providers tab.
        </p>
        <Badge tone="neutral">{assets.data.length} assets</Badge>
      </div>

      {assets.data.length === 0 && (
        <div className="mt-5 rounded-2xl border border-line bg-surface p-10 text-center text-sm text-faint">
          No assets yet — run a workflow with a storage node to persist outputs here.
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {assets.data.map((asset) => (
          <div key={asset.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <AssetThumb asset={asset} />
            <div className="space-y-1.5 p-3">
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-semibold text-inktext">{asset.tool}</span>
                <Badge tone={asset.kind === 'video' ? 'cyan' : 'blue'}>{asset.kind}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-faint">
                <span className="truncate">{asset.provider ?? '—'} / {asset.model ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-faint">
                <span>{formatBytes(asset.sizeBytes)}</span>
                <span>{formatDate(asset.createdAt)}</span>
              </div>
              <button
                onClick={() => setDeleting(asset)}
                className="mt-1 w-full rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete asset"
        description={
          deleting ? (
            <>
              Delete <span className="font-mono text-inktext">{deleting.id}</span>? The file will be
              removed from disk and the record from the database. This cannot be undone.
            </>
          ) : (
            ''
          )
        }
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

const DRIVERS: Array<{ value: StorageDriver; hint: string }> = [
  { value: 'local', hint: 'writes to server disk' },
  { value: 'cloudinary', hint: 'needs cloudName/apiKey/apiSecret/folder' },
  { value: 's3', hint: 'needs bucket/region/accessKeyId/secretAccessKey' },
  { value: 'r2', hint: 'needs accountId/bucket/accessKeyId/secretAccessKey' },
  { value: 'supabase', hint: 'needs url/serviceKey/bucket' },
];

function driverHint(driver: string): string {
  return DRIVERS.find((d) => d.value === driver)?.hint ?? '';
}

function ProviderFormModal({
  provider,
  onClose,
}: {
  provider: StorageProvider | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(provider?.name ?? '');
  const [driver, setDriver] = useState<StorageDriver>(provider?.driver ?? 'local');
  const [configText, setConfigText] = useState('{}');
  const [enabled, setEnabled] = useState(provider?.enabled ?? true);
  const [isActive, setIsActive] = useState(provider?.isActive ?? false);
  const [priority, setPriority] = useState(provider?.priority ?? 0);
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: async () => {
      let config: Record<string, unknown> = {};
      if (configText.trim()) {
        try {
          config = JSON.parse(configText) as Record<string, unknown>;
        } catch {
          throw new Error('config must be valid JSON');
        }
      }
      if (provider) {
        await updateStorageProvider(provider.id, { config, enabled, isActive, priority });
      } else {
        if (!name.trim()) throw new Error('name is required');
        await createStorageProvider({
          name: name.trim(),
          driver,
          config,
          enabled,
          isActive,
          priority,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providersKey });
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <Modal
      open
      title={provider ? `Edit ${provider.name}` : 'Add storage provider'}
      onClose={onClose}
    >
      <div className="space-y-3">
        {!provider && (
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. prod-cloudinary"
              className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
            />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Driver</span>
          <select
            value={driver}
            onChange={(e) => setDriver(e.target.value as StorageDriver)}
            disabled={provider !== null}
            className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none focus:border-blue disabled:opacity-50"
          >
            {DRIVERS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.value} — {d.hint}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Config (JSON)</span>
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            rows={5}
            spellCheck={false}
            placeholder='{ "folder": "my-app" }'
            className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 font-mono text-[11px] text-inktext outline-none placeholder:text-faint focus:border-blue"
          />
          <span className="mt-0.5 block text-[10px] text-faint">
            {driverHint(driver)}. Stored encrypted. Leave as {'{}'} to keep existing (edit only).
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center justify-between rounded-lg border border-line bg-elevated px-2.5 py-2">
            <span className="text-[11px] text-muted">Enabled</span>
            <Toggle checked={enabled} onChange={setEnabled} />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-line bg-elevated px-2.5 py-2">
            <span className="text-[11px] text-muted">Active (routes default here)</span>
            <Toggle checked={isActive} onChange={setIsActive} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Priority (lower = tried first)</span>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none focus:border-blue"
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <ActionButton onClick={onClose}>Cancel</ActionButton>
        <ActionButton tone="primary" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : provider ? 'Save' : 'Create'}
        </ActionButton>
      </div>
      <InlineMessage message={error} tone="error" />
    </Modal>
  );
}

function ProvidersTab() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<StorageProvider | null>(null);
  const [deleting, setDeleting] = useState<StorageProvider | null>(null);
  const [testResult, setTestResult] = useState<{
    providerId: string;
    ok: boolean;
    message: string;
  } | null>(null);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: providersKey });

  const providers = useQuery({
    queryKey: providersKey,
    queryFn: fetchStorageProviders,
  });

  const toggleEnabled = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateStorageProvider(id, { enabled }),
    onSuccess: invalidate,
  });

  const setActive = useMutation({
    mutationFn: (id: string) => updateStorageProvider(id, { isActive: true }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteStorageProvider(id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
    },
    onError: () => setDeleting(null),
  });

  const runTest = useMutation({
    mutationFn: (id: string) => testStorageProvider(id),
    onSuccess: (result, providerId) =>
      setTestResult({ providerId, ok: result.ok, message: result.message }),
    onError: (err, providerId) =>
      setTestResult({ providerId, ok: false, message: errorMessage(err) }),
  });

  if (providers.isPending) return <LoadingBlock label="Loading providers…" />;
  if (providers.isError)
    return <ErrorBlock message="Failed to load storage providers" onRetry={() => providers.refetch()} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Storage backends for storage nodes. The active provider receives persisted outputs by
          default; a storage node can target a specific provider via its route config.
        </p>
        <ActionButton tone="primary" onClick={() => setCreating(true)}>
          + Add provider
        </ActionButton>
      </div>

      {providers.data.length === 0 && (
        <div className="mt-5 rounded-2xl border border-line bg-surface p-10 text-center text-sm text-faint">
          No storage providers yet — the local driver is used automatically. Add one to persist to
          an external backend.
        </div>
      )}

      <div className="mt-5 space-y-3">
        {providers.data.map((provider) => (
          <div key={provider.id} className="rounded-xl border border-line bg-surface">
            <div className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-inktext">{provider.name}</span>
                  <Badge tone={provider.driver === 'local' ? 'neutral' : 'blue'}>
                    {provider.driver}
                  </Badge>
                  {provider.isActive && <Badge tone="emerald">active</Badge>}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-faint">
                  <span>priority {provider.priority}</span>
                  <span>·</span>
                  {provider.configConfigured ? (
                    <Badge tone="emerald">config ✓</Badge>
                  ) : (
                    <Badge tone="amber">no config</Badge>
                  )}
                </div>
              </div>
              {!provider.isActive && provider.enabled && (
                <ActionButton onClick={() => setActive.mutate(provider.id)}>
                  Set active
                </ActionButton>
              )}
              <ActionButton
                onClick={() => {
                  setTestResult(null);
                  runTest.mutate(provider.id);
                }}
                disabled={runTest.isPending}
              >
                {runTest.isPending ? 'Testing…' : 'Test'}
              </ActionButton>
              <ActionButton onClick={() => setEditing(provider)}>Edit</ActionButton>
              <button
                onClick={() => setDeleting(provider)}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
              >
                Delete
              </button>
              <Toggle
                checked={provider.enabled}
                onChange={(v) => toggleEnabled.mutate({ id: provider.id, enabled: v })}
              />
            </div>

            {testResult?.providerId === provider.id && (
              <div className="border-t border-line px-4 py-2 text-xs">
                <span className={testResult.ok ? 'text-emerald' : 'text-red'}>
                  {testResult.ok ? '✓ ' : '✗ '}
                  {testResult.message}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {creating && <ProviderFormModal provider={null} onClose={() => setCreating(false)} />}
      {editing && <ProviderFormModal provider={editing} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete storage provider"
        description={
          deleting ? (
            <>
              Delete <span className="font-mono text-inktext">{deleting.name}</span>? Existing
              assets stay on disk but future storage node writes will no longer target this backend.
            </>
          ) : (
            ''
          )
        }
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

type Tab = 'assets' | 'providers';

export function StoragePage() {
  const [tab, setTab] = useState<Tab>('assets');

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Storage</h1>
          <p className="mt-1 text-sm text-muted">Persisted workflow outputs and the backends they land on.</p>
        </div>
      </div>

      <div className="mt-5 flex gap-1 rounded-xl border border-line bg-surface p-1">
        {(
          [
            ['assets', 'Assets'],
            ['providers', 'Providers'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              tab === key ? 'bg-blue/15 text-blue' : 'text-muted hover:bg-elevated'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">{tab === 'assets' ? <AssetsTab /> : <ProvidersTab />}</div>
    </div>
  );
}
