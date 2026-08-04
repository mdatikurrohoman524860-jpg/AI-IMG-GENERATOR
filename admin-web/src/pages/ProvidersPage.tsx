import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminProvider,
  createAdminProviderCredential,
  createAdminProviderModel,
  deleteAdminProviderCredential,
  deleteAdminProviderModel,
  fetchAdminProviders,
  testAdminProvider,
  testAdminProviderCredential,
  updateAdminProvider,
  updateAdminProviderCredential,
  updateAdminProviderModel,
} from '../api/admin';
import { errorMessage } from '../api/client';
import type {
  ProviderAdmin,
  ProviderCredential,
  ProviderModel,
  ProviderTestResult,
} from '../api/types';
import {
  ActionButton,
  Badge,
  ErrorBlock,
  formatDate,
  InlineMessage,
  LoadingBlock,
  Modal,
  Toggle,
} from '../components/ui';

const providersKey = ['admin', 'providers'] as const;

function CapabilityBadges({ p }: { p: ProviderAdmin }) {
  return (
    <span className="flex flex-wrap gap-1">
      {p.supportsImages && <Badge tone="blue">image</Badge>}
      {p.supportsVideo && <Badge tone="cyan">video</Badge>}
      {p.supportsVision && <Badge tone="neutral">vision</Badge>}
      {!p.supportsImages && !p.supportsVideo && !p.supportsVision && (
        <span className="text-xs text-faint">chat only</span>
      )}
    </span>
  );
}

function healthTone(status: string): 'emerald' | 'amber' | 'red' | 'neutral' {
  if (status === 'healthy') return 'emerald';
  if (status === 'degraded') return 'amber';
  if (status === 'down') return 'red';
  return 'neutral';
}

interface ProviderForm {
  displayName: string;
  baseUrl: string;
  apiKey: string;
  supportsImages: boolean;
  supportsVision: boolean;
  supportsVideo: boolean;
  priority: number;
}

function ProviderFormFields({
  form,
  setForm,
}: {
  form: ProviderForm;
  setForm: (next: ProviderForm) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Display name</span>
        <input
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none focus:border-blue"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Base URL</span>
        <input
          value={form.baseUrl}
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
          placeholder="https://api.example.com/v1"
          className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">API key</span>
        <input
          type="password"
          value={form.apiKey}
          onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
          placeholder="sk-…"
          className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
        />
        <span className="mt-0.5 block text-[10px] text-faint">Stored encrypted. Leave blank to keep the current key.</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ['supportsImages', 'Images'],
            ['supportsVideo', 'Video'],
            ['supportsVision', 'Vision'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between rounded-lg border border-line bg-elevated px-2.5 py-2">
            <span className="text-[11px] text-muted">{label}</span>
            <Toggle
              checked={form[key]}
              onChange={(value) => setForm({ ...form, [key]: value })}
            />
          </label>
        ))}
      </div>
      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Priority (lower = tried first)</span>
        <input
          type="number"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
          className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none focus:border-blue"
        />
      </label>
    </div>
  );
}

interface ModelForm {
  displayName: string;
  internalName: string;
  supportsImages: boolean;
  supportsVideo: boolean;
  maxTokens: number | null;
}

function ModelEditor({
  providerId,
  model,
  onDone,
}: {
  providerId: string;
  model: ProviderModel | null;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ModelForm>({
    displayName: model?.displayName ?? '',
    internalName: model?.internalName ?? '',
    supportsImages: model?.supportsImages ?? false,
    supportsVideo: model?.supportsVideo ?? false,
    maxTokens: model?.maxTokens ?? null,
  });
  const [error, setError] = useState('');
  const invalidate = () => queryClient.invalidateQueries({ queryKey: providersKey });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.displayName.trim() || !form.internalName.trim()) {
        throw new Error('display name and internal name are required');
      }
      const payload = {
        displayName: form.displayName.trim(),
        internalName: form.internalName.trim(),
        supportsImages: form.supportsImages,
        supportsVideo: form.supportsVideo,
        maxTokens: form.maxTokens ?? undefined,
      };
      if (model) {
        await updateAdminProviderModel(providerId, model.id, payload);
      } else {
        await createAdminProviderModel(providerId, payload);
      }
    },
    onSuccess: () => {
      invalidate();
      onDone();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <div className="rounded-xl border border-line bg-elevated p-3">
      <div className="mb-2 text-[11px] font-semibold text-muted">
        {model ? 'Edit model' : 'Add model'}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          placeholder="Display name (e.g. Minimax Video)"
          className="rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
        />
        <input
          value={form.internalName}
          onChange={(e) => setForm({ ...form, internalName: e.target.value })}
          placeholder="Internal name (e.g. minimax-video-01)"
          className="rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
        />
      </div>
      <div className="mt-2 flex items-center gap-4">
        <label className="flex items-center gap-2 text-[11px] text-muted">
          <Toggle checked={form.supportsImages} onChange={(v) => setForm({ ...form, supportsImages: v })} />
          images
        </label>
        <label className="flex items-center gap-2 text-[11px] text-muted">
          <Toggle checked={form.supportsVideo} onChange={(v) => setForm({ ...form, supportsVideo: v })} />
          video
        </label>
        <input
          type="number"
          value={form.maxTokens ?? ''}
          onChange={(e) => setForm({ ...form, maxTokens: e.target.value === '' ? null : Number(e.target.value) })}
          placeholder="max tokens"
          className="w-28 rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
        />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <ActionButton onClick={onDone}>Cancel</ActionButton>
        <ActionButton tone="primary" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save model'}
        </ActionButton>
      </div>
      <InlineMessage message={error} tone="error" />
    </div>
  );
}

interface CredentialForm {
  label: string;
  apiKey: string;
  enabled: boolean;
  priority: number;
}

function CredentialModal({
  provider,
  credential,
  onClose,
}: {
  provider: ProviderAdmin;
  credential: ProviderCredential | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CredentialForm>({
    label: credential?.label ?? '',
    apiKey: '',
    enabled: credential?.enabled ?? true,
    priority: credential?.priority ?? 0,
  });
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: async () => {
      if (credential) {
        const patch: Record<string, unknown> = {
          label: form.label.trim() || undefined,
          enabled: form.enabled,
          priority: form.priority,
        };
        if (form.apiKey.trim()) patch.apiKey = form.apiKey.trim();
        await updateAdminProviderCredential(provider.id, credential.id, patch);
      } else {
        if (!form.apiKey.trim()) throw new Error('API key is required');
        await createAdminProviderCredential(provider.id, {
          label: form.label.trim() || undefined,
          apiKey: form.apiKey.trim(),
          enabled: form.enabled,
          priority: form.priority,
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
      title={
        credential
          ? `Edit key ${credential.label} (${provider.displayName})`
          : `Add API key (${provider.displayName})`
      }
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Label</span>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. prod-1"
              className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Priority (lower = tried first)</span>
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none focus:border-blue"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">
            API key {credential ? '(leave blank to keep current)' : ''}
          </span>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            placeholder="sk-…"
            className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
          />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-line bg-elevated px-2.5 py-2">
          <span className="text-[11px] text-muted">Enabled</span>
          <Toggle checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} />
        </label>
        {credential && (
          <p className="text-[11px] text-faint">
            Rotating a key resets its failure streak and last error. Keys are stored encrypted.
          </p>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <ActionButton onClick={onClose}>Cancel</ActionButton>
        <ActionButton tone="primary" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : credential ? 'Save' : 'Add key'}
        </ActionButton>
      </div>
      <InlineMessage message={error} tone="error" />
    </Modal>
  );
}

function ProviderRow({ provider }: { provider: ProviderAdmin }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingModel, setEditingModel] = useState<ProviderModel | null | undefined>(undefined);
  const [keysExpanded, setKeysExpanded] = useState(false);
  const [editingCredential, setEditingCredential] = useState<
    ProviderCredential | null | 'new' | undefined
  >(undefined);
  const [credentialTest, setCredentialTest] = useState<{
    credentialId: string;
    result: ProviderTestResult;
  } | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: providersKey });

  const toggleEnabled = useMutation({
    mutationFn: () => updateAdminProvider(provider.id, { enabled: !provider.enabled }),
    onSuccess: invalidate,
  });

  const toggleModel = useMutation({
    mutationFn: ({ modelId, enabled }: { modelId: string; enabled: boolean }) =>
      updateAdminProviderModel(provider.id, modelId, { enabled }),
    onSuccess: invalidate,
  });

  const removeModel = useMutation({
    mutationFn: (modelId: string) => deleteAdminProviderModel(provider.id, modelId),
    onSuccess: invalidate,
  });

  const toggleCredential = useMutation({
    mutationFn: ({ credentialId, enabled }: { credentialId: string; enabled: boolean }) =>
      updateAdminProviderCredential(provider.id, credentialId, { enabled }),
    onSuccess: invalidate,
  });

  const removeCredential = useMutation({
    mutationFn: (credentialId: string) =>
      deleteAdminProviderCredential(provider.id, credentialId),
    onSuccess: invalidate,
  });

  const runCredentialTest = useMutation({
    mutationFn: (credentialId: string) =>
      testAdminProviderCredential(provider.id, credentialId),
    onSuccess: (result, credentialId) =>
      setCredentialTest({ credentialId, result }),
    onError: (err, credentialId) =>
      setCredentialTest({
        credentialId,
        result: { ok: false, latencyMs: 0, status: 0, message: errorMessage(err) },
      }),
  });

  const runTest = useMutation({
    mutationFn: () => testAdminProvider(provider.id),
    onSuccess: (result) => setTestResult({ ok: result.ok, message: result.message }),
    onError: (err) => setTestResult({ ok: false, message: errorMessage(err) }),
  });

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-inktext">{provider.displayName}</span>
            <span className="font-mono text-[11px] text-faint">{provider.name}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <CapabilityBadges p={provider} />
            <span className="text-[11px] text-faint">· {provider.models.length} models</span>
            {provider.apiKeyConfigured ? (
              <Badge tone="emerald">key ✓</Badge>
            ) : (
              <Badge tone="amber">keyless</Badge>
            )}
            <Badge tone={healthTone(provider.healthStatus)}>{provider.healthStatus}</Badge>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:bg-elevated"
        >
          {expanded ? 'Hide models' : 'Models'}
        </button>
        <button
          onClick={() => setKeysExpanded((v) => !v)}
          className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:bg-elevated"
        >
          {keysExpanded ? 'Hide keys' : `Keys (${provider.credentials.length})`}
        </button>
        <ActionButton
          onClick={() => {
            setTestResult(null);
            runTest.mutate();
          }}
          disabled={runTest.isPending}
        >
          {runTest.isPending ? 'Testing…' : 'Test'}
        </ActionButton>
        <ActionButton onClick={() => setEditing(true)}>Edit</ActionButton>
        <Toggle checked={provider.enabled} onChange={() => toggleEnabled.mutate()} />
      </div>

      {testResult && (
        <div className="border-t border-line px-4 py-2 text-xs">
          <span className={testResult.ok ? 'text-emerald' : 'text-red'}>
            {testResult.ok ? '✓ ' : '✗ '}
            {testResult.message}
          </span>
        </div>
      )}

      {expanded && (
        <div className="space-y-2 border-t border-line p-4">
          {provider.models.map((model) => (
            <div key={model.id} className="flex items-center gap-3 rounded-lg border border-line bg-elevated px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-semibold text-inktext">{model.displayName}</span>
                  {model.hidden && <Badge tone="neutral">hidden</Badge>}
                </div>
                <span className="font-mono text-[10px] text-faint">{model.internalName}</span>
              </div>
              <span className="flex gap-1">
                {model.supportsImages && <Badge tone="blue">image</Badge>}
                {model.supportsVideo && <Badge tone="cyan">video</Badge>}
                {model.supportsVision && <Badge tone="neutral">vision</Badge>}
              </span>
              {model.maxTokens != null && (
                <span className="text-[10px] text-faint">{model.maxTokens.toLocaleString()} tok</span>
              )}
              <button
                onClick={() => setEditingModel(model)}
                className="rounded px-1.5 py-0.5 text-[11px] text-muted hover:bg-line"
              >
                edit
              </button>
              <button
                onClick={() => removeModel.mutate(model.id)}
                className="rounded px-1.5 py-0.5 text-[11px] text-red-400 hover:bg-red-500/10"
              >
                ✕
              </button>
              <Toggle checked={model.enabled} onChange={(v) => toggleModel.mutate({ modelId: model.id, enabled: v })} />
            </div>
          ))}
          {editingModel !== undefined && (
            <ModelEditor
              providerId={provider.id}
              model={editingModel}
              onDone={() => setEditingModel(undefined)}
            />
          )}
          {editingModel === undefined && (
            <button
              onClick={() => setEditingModel(null)}
              className="w-full rounded-lg border border-dashed border-line py-2 text-xs text-muted hover:border-blue/40 hover:text-blue"
            >
              + Add model
            </button>
          )}
        </div>
      )}

      {keysExpanded && (
        <div className="space-y-2 border-t border-line p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">
              Key pool — the engine falls through enabled keys by priority and auto-rotates on
              failures
            </span>
            {editingCredential === undefined && (
              <button
                onClick={() => setEditingCredential('new')}
                className="rounded-lg border border-dashed border-line px-2.5 py-1 text-[11px] text-muted hover:border-blue/40 hover:text-blue"
              >
                + Add key
              </button>
            )}
          </div>
          {provider.credentials.length === 0 && (
            <div className="rounded-lg border border-dashed border-line py-3 text-center text-[11px] text-faint">
              No pool keys — the provider's primary key is used. Add keys to enable rotation.
            </div>
          )}
          {provider.credentials.map((credential) => (
            <div
              key={credential.id}
              className="rounded-lg border border-line bg-elevated px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-semibold text-inktext">
                      {credential.label || 'Default'}
                    </span>
                    <span className="font-mono text-[10px] text-faint">
                      {credential.apiKeyMasked ?? 'no key'}
                    </span>
                    {credential.failureStreak > 0 && (
                      <Badge tone="red">{credential.failureStreak} fail</Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-[10px] text-faint">
                    priority {credential.priority}
                    {credential.lastUsedAt ? ` · last used ${formatDate(credential.lastUsedAt)}` : ''}
                    {credential.lastError ? ` · ${credential.lastError.slice(0, 80)}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCredentialTest(null);
                    runCredentialTest.mutate(credential.id);
                  }}
                  disabled={runCredentialTest.isPending}
                  className="rounded px-1.5 py-0.5 text-[11px] text-muted hover:bg-line"
                >
                  {runCredentialTest.isPending ? '…' : 'test'}
                </button>
                <button
                  onClick={() => setEditingCredential(credential)}
                  className="rounded px-1.5 py-0.5 text-[11px] text-muted hover:bg-line"
                >
                  edit
                </button>
                <button
                  onClick={() => removeCredential.mutate(credential.id)}
                  className="rounded px-1.5 py-0.5 text-[11px] text-red-400 hover:bg-red-500/10"
                >
                  ✕
                </button>
                <Toggle
                  checked={credential.enabled}
                  onChange={(v) => toggleCredential.mutate({ credentialId: credential.id, enabled: v })}
                />
              </div>
              {credentialTest?.credentialId === credential.id && (
                <div className="mt-1.5 border-t border-line pt-1.5 text-[11px]">
                  <span className={credentialTest.result.ok ? 'text-emerald' : 'text-red'}>
                    {credentialTest.result.ok ? '✓ ' : '✗ '}
                    {credentialTest.result.message}
                    {credentialTest.result.latencyMs > 0
                      ? ` (${credentialTest.result.latencyMs}ms)`
                      : ''}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingCredential !== undefined && (
        <CredentialModal
          provider={provider}
          credential={editingCredential === 'new' ? null : editingCredential}
          onClose={() => setEditingCredential(undefined)}
        />
      )}

      {editing && (
        <ProviderModal
          provider={provider}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function ProviderModal({
  provider,
  onClose,
  onSaved,
}: {
  provider: ProviderAdmin;
  onClose: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProviderForm>({
    displayName: provider.displayName,
    baseUrl: provider.baseUrl,
    apiKey: '',
    supportsImages: provider.supportsImages,
    supportsVision: provider.supportsVision,
    supportsVideo: provider.supportsVideo,
    priority: provider.priority,
  });
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: async () => {
      const patch: Record<string, unknown> = {
        displayName: form.displayName.trim(),
        baseUrl: form.baseUrl.trim(),
        supportsImages: form.supportsImages,
        supportsVision: form.supportsVision,
        supportsVideo: form.supportsVideo,
        priority: form.priority,
      };
      if (form.apiKey.trim()) patch.apiKey = form.apiKey.trim();
      await updateAdminProvider(provider.id, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providersKey });
      onSaved();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <Modal open title={`Edit ${provider.displayName}`} onClose={onClose}>
      <ProviderFormFields form={form} setForm={setForm} />
      <div className="mt-4 flex justify-end gap-2">
        <ActionButton onClick={onClose}>Cancel</ActionButton>
        <ActionButton tone="primary" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </ActionButton>
      </div>
      <InlineMessage message={error} tone="error" />
    </Modal>
  );
}

interface CreateForm extends ProviderForm {
  name: string;
  models: Array<{ displayName: string; internalName: string; supportsVideo: boolean }>;
}

export function ProvidersPage() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CreateForm>({
    name: '',
    displayName: '',
    baseUrl: 'https://queue.fal.run',
    apiKey: '',
    supportsImages: false,
    supportsVision: false,
    supportsVideo: false,
    priority: 100,
    models: [],
  });

  const providers = useQuery({ queryKey: providersKey, queryFn: fetchAdminProviders });

  const create = useMutation({
    mutationFn: () => {
      if (!form.name.trim() || !form.displayName.trim()) {
        throw new Error('name and display name are required');
      }
      return createAdminProvider({
        name: form.name.trim().toLowerCase(),
        displayName: form.displayName.trim(),
        baseUrl: form.baseUrl.trim() || undefined,
        apiKey: form.apiKey.trim() || undefined,
        supportsImages: form.supportsImages,
        supportsVision: form.supportsVision,
        supportsVideo: form.supportsVideo,
        priority: form.priority,
        models: form.models.filter((m) => m.internalName.trim()),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providersKey });
      setCreating(false);
      setForm({
        name: '',
        displayName: '',
        baseUrl: 'https://queue.fal.run',
        apiKey: '',
        supportsImages: false,
        supportsVision: false,
        supportsVideo: false,
        priority: 100,
        models: [],
      });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  if (providers.isPending) return <LoadingBlock label="Loading providers…" />;
  if (providers.isError)
    return <ErrorBlock message="Failed to load providers" onRetry={() => providers.refetch()} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Providers</h1>
          <p className="mt-1 text-sm text-muted">
            Add providers, paste API keys, and mark capabilities — then bind their models to tools
            (Admin → Tools) or node chains.
          </p>
        </div>
        <ActionButton tone="primary" onClick={() => setCreating(true)}>
          + Add provider
        </ActionButton>
      </div>

      <div className="mt-5 space-y-3">
        {providers.data.map((provider) => (
          <ProviderRow key={provider.id} provider={provider} />
        ))}
      </div>

      <Modal open={creating} title="Add provider" onClose={() => setCreating(false)}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Name (slug)</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. fal"
                className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Display name</span>
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="e.g. Fal AI"
                className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Base URL</span>
            <input
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none focus:border-blue"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">API key (optional)</span>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="sk-…"
              className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['supportsImages', 'Images'],
                ['supportsVideo', 'Video'],
                ['supportsVision', 'Vision'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-lg border border-line bg-elevated px-2.5 py-2">
                <span className="text-[11px] text-muted">{label}</span>
                <Toggle
                  checked={form[key]}
                  onChange={(value) => setForm({ ...form, [key]: value })}
                />
              </label>
            ))}
          </div>
          {form.models.map((model, index) => (
            <div key={index} className="flex items-center gap-2 rounded-lg border border-line bg-elevated px-2 py-1.5">
              <input
                value={model.displayName}
                onChange={(e) => {
                  const next = [...form.models];
                  next[index] = { ...next[index], displayName: e.target.value };
                  setForm({ ...form, models: next });
                }}
                placeholder="Model display name"
                className="flex-1 rounded-lg border border-line bg-ink px-2 py-1 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
              />
              <input
                value={model.internalName}
                onChange={(e) => {
                  const next = [...form.models];
                  next[index] = { ...next[index], internalName: e.target.value };
                  setForm({ ...form, models: next });
                }}
                placeholder="internal id"
                className="flex-1 rounded-lg border border-line bg-ink px-2 py-1 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
              />
              <label className="flex items-center gap-1 text-[10px] text-faint">
                video
                <Toggle
                  checked={model.supportsVideo}
                  onChange={(v) => {
                    const next = [...form.models];
                    next[index] = { ...next[index], supportsVideo: v };
                    setForm({ ...form, models: next });
                  }}
                />
              </label>
              <button
                onClick={() => setForm({ ...form, models: form.models.filter((_, i) => i !== index) })}
                className="rounded px-1 text-[11px] text-red-400 hover:bg-red-500/10"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => setForm({ ...form, models: [...form.models, { displayName: '', internalName: '', supportsVideo: false }] })}
            className="w-full rounded-lg border border-dashed border-line py-1.5 text-xs text-muted hover:border-blue/40 hover:text-blue"
          >
            + Add initial model
          </button>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <ActionButton onClick={() => setCreating(false)}>Cancel</ActionButton>
          <ActionButton tone="primary" onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create provider'}
          </ActionButton>
        </div>
        <InlineMessage message={error} tone="error" />
      </Modal>
    </div>
  );
}
