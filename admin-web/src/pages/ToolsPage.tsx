import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminProviders,
  fetchAdminTools,
  updateAdminTool,
} from '../api/admin';
import { errorMessage } from '../api/client';
import type { ProviderAdmin, ToolAdmin } from '../api/types';
import {
  Badge,
  ErrorBlock,
  InlineMessage,
  LoadingBlock,
  Toggle,
} from '../components/ui';

const toolsKey = ['admin', 'tools'] as const;
const providersKey = ['admin', 'providers'] as const;

function capabilityTone(capability: ToolAdmin['capability']): 'blue' | 'cyan' | 'emerald' | 'neutral' {
  if (capability === 'image') return 'blue';
  if (capability === 'video') return 'cyan';
  if (capability === 'mask') return 'emerald';
  return 'neutral';
}

function BindingEditor({
  tool,
  providers,
}: {
  tool: ToolAdmin;
  providers: ProviderAdmin[];
}) {
  const queryClient = useQueryClient();
  const [draftProvider, setDraftProvider] = useState('');
  const [draftModel, setDraftModel] = useState('');
  const [error, setError] = useState('');

  const binding: Array<{ provider: string; model: string }> = Array.isArray(
    tool.defaultBinding,
  )
    ? tool.defaultBinding
    : [];

  const matchingProviders = providers.filter((p) =>
    tool.capability === 'video' ? p.supportsVideo : p.supportsImages,
  );
  const draftProviderRow = providers.find((p) => p.name === draftProvider);
  const draftModels = (draftProviderRow?.models ?? []).filter(
    (m) => m.enabled && (tool.capability === 'video' ? m.supportsVideo : m.supportsImages),
  );

  const save = useMutation({
    mutationFn: (next: Array<{ provider: string; model: string }>) =>
      updateAdminTool(tool.key, { defaultBinding: next }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: toolsKey }),
    onError: (err) => setError(errorMessage(err)),
  });

  const addStep = () => {
    if (!draftProvider || !draftModel) return;
    save.mutate([...binding, { provider: draftProvider, model: draftModel }]);
    setDraftProvider('');
    setDraftModel('');
  };

  const moveStep = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= binding.length) return;
    const next = [...binding];
    const [step] = next.splice(index, 1);
    next.splice(target, 0, step);
    save.mutate(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">
          Default binding — used when a node has no chain
        </span>
        <span className="text-[10px] text-faint">{binding.length} step{binding.length === 1 ? '' : 's'}</span>
      </div>

      {binding.length === 0 && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-300">
          Empty — the tool only works when a node chain or routing variable supplies providers.
        </p>
      )}

      {binding.length > 0 && (
        <ul className="space-y-1.5">
          {binding.map((step, index) => {
            const row = providers.find((p) => p.name === step.provider);
            const ok = !!row && row.enabled && matchingProviders.some((p) => p.name === step.provider);
            return (
              <li
                key={`${index}-${step.provider}-${step.model}`}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${ok ? 'border-line bg-elevated' : 'border-amber-500/30 bg-amber-500/5'}`}
              >
                <span className="w-4 shrink-0 text-center text-[10px] tabular-nums text-faint">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-inktext">{row?.displayName ?? step.provider}</p>
                  <p className="truncate text-[10px] text-faint">
                    {row?.models.find((m) => m.internalName === step.model)?.displayName ?? step.model}
                  </p>
                </div>
                {!ok && <span className="shrink-0 text-[10px] text-amber-400">skip</span>}
                <div className="flex shrink-0 gap-0.5">
                  <button
                    onClick={() => moveStep(index, -1)}
                    disabled={index === 0 || save.isPending}
                    className="rounded px-1 text-[11px] text-faint hover:bg-line hover:text-inktext disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveStep(index, 1)}
                    disabled={index === binding.length - 1 || save.isPending}
                    className="rounded px-1 text-[11px] text-faint hover:bg-line hover:text-inktext disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => save.mutate(binding.filter((_, i) => i !== index))}
                    className="rounded px-1 text-[11px] text-red-400 hover:bg-red-500/10"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex gap-1.5">
        <select
          value={draftProvider}
          onChange={(e) => {
            setDraftProvider(e.target.value);
            setDraftModel('');
          }}
          className="flex-1 rounded-lg border border-line bg-ink px-1.5 py-1.5 text-[11px] text-inktext outline-none focus:border-blue"
        >
          <option value="">provider…</option>
          {matchingProviders.map((p) => (
            <option key={p.id} value={p.name} disabled={!p.enabled}>
              {p.displayName}
              {!p.enabled ? ' (disabled)' : ''}
            </option>
          ))}
        </select>
        <select
          value={draftModel}
          onChange={(e) => setDraftModel(e.target.value)}
          disabled={!draftModels.length}
          className="flex-1 rounded-lg border border-line bg-ink px-1.5 py-1.5 text-[11px] text-inktext outline-none focus:border-blue disabled:opacity-40"
        >
          <option value="">model…</option>
          {draftModels.map((m) => (
            <option key={m.id} value={m.internalName}>
              {m.displayName}
            </option>
          ))}
        </select>
        <button
          onClick={addStep}
          disabled={!draftProvider || !draftModel || save.isPending}
          className="rounded-lg border border-blue/40 bg-blue/10 px-2 text-[11px] font-medium text-blue-300 hover:bg-blue/20 disabled:opacity-40"
        >
          + Add
        </button>
      </div>
      <InlineMessage message={error} tone="error" />
    </div>
  );
}

export function ToolsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const tools = useQuery({ queryKey: toolsKey, queryFn: fetchAdminTools });
  const providers = useQuery({ queryKey: providersKey, queryFn: fetchAdminProviders });

  const toggle = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      updateAdminTool(key, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: toolsKey }),
    onError: (err) => setError(errorMessage(err)),
  });

  if (tools.isPending || providers.isPending) return <LoadingBlock label="Loading tools…" />;
  if (tools.isError || providers.isError)
    return <ErrorBlock message="Failed to load tools" onRetry={() => { void tools.refetch(); void providers.refetch(); }} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tools</h1>
          <p className="mt-1 text-sm text-muted">
            Every tool maps to a node type in the workflow builder. Toggle availability and set a
            default provider chain used when a node has no explicit binding.
          </p>
        </div>
      </div>

      <InlineMessage message={error} tone="error" />

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {tools.data.map((tool) => (
          <div
            key={tool.key}
            className={`rounded-2xl border bg-surface p-4 transition-opacity ${tool.enabled ? 'border-line' : 'border-line/50 opacity-70'}`}
          >
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${tool.color}`}>
                {tool.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-inktext">{tool.name}</span>
                  <Badge tone={capabilityTone(tool.capability)}>{tool.capability}</Badge>
                  {tool.requiresInput && <Badge tone="amber">needs input</Badge>}
                  <span className="font-mono text-[10px] text-faint">{tool.key}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{tool.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-faint">{tool.enabled ? 'on' : 'off'}</span>
                <Toggle
                  checked={tool.enabled}
                  onChange={(value) => toggle.mutate({ key: tool.key, enabled: value })}
                />
              </div>
            </div>

            <div className="mt-3 border-t border-line pt-3">
              <BindingEditor tool={tool} providers={providers.data} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
