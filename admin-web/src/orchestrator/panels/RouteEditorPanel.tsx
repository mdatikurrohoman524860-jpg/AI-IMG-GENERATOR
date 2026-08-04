import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminRoute,
  fetchAdminProviders,
  fetchAdminRoutes,
  updateAdminRoute,
} from '../../api/admin';
import { errorMessage } from '../../api/client';
import type { ModelRouteStep } from '../../api/types';
import { useWorkflowStore } from '../store/workflowStore';
import { useNodeLibraryStore } from '../dynamicLibrary';

interface StepRow {
  provider: string;
  model: string;
}

const routesKey = ['admin', 'routes'] as const;

function toRows(steps: unknown): StepRow[] {
  if (!Array.isArray(steps)) return [];
  return steps
    .filter(
      (s): s is { provider?: unknown; model?: unknown } =>
        typeof s === 'object' && s !== null,
    )
    .map((s) => ({
      provider: typeof s.provider === 'string' ? s.provider : '',
      model: typeof s.model === 'string' ? s.model : '',
    }));
}

/**
 * Inline model-route manager for the modelRoute node — create and edit the
 * fallback group straight from the properties panel.
 */
export function RouteEditorPanel({ nodeId }: { nodeId: string }) {
  const queryClient = useQueryClient();
  const reloadLibrary = useNodeLibraryStore((s) => s.reload);
  const config = useWorkflowStore((s) => s.nodes.find((n) => n.id === nodeId)?.data.config ?? {});
  const updateNodeConfig = useWorkflowStore((s) => s.updateNodeConfig);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<StepRow[]>([]);
  const [error, setError] = useState('');

  const { data: routes, isLoading } = useQuery({ queryKey: routesKey, queryFn: fetchAdminRoutes });
  const { data: providers } = useQuery({
    queryKey: ['admin', 'providers'],
    queryFn: fetchAdminProviders,
  });

  const routeId = typeof config.routeId === 'string' && config.routeId ? config.routeId : '';
  const route = routeId ? (routes ?? []).find((r) => r.id === routeId || r.name === routeId) : undefined;

  const providerOptions = useMemo(
    () =>
      (providers ?? []).map((p) => ({
        value: p.name,
        label: p.displayName || p.name,
        models: p.models
          .filter((m) => m.enabled)
          .map((m) => ({ value: m.internalName, label: m.displayName || m.internalName })),
      })),
    [providers],
  );

  const refresh = async () => {
    queryClient.invalidateQueries({ queryKey: routesKey });
    await reloadLibrary();
  };

  const editing = route ? toRows(route.steps) : rows;
  const editingName = route ? route.name : name;
  const editingDescription = route ? route.description ?? '' : description;
  const editingEnabled = route ? route.enabled : true;

  const save = useMutation({
    mutationFn: async () => {
      if (!editingName.trim()) throw new Error('route name is required');
      const steps: ModelRouteStep[] = editing
        .filter((s) => s.provider.trim() && s.model.trim())
        .map((s) => ({ provider: s.provider.trim(), model: s.model.trim() }));
      const payload = {
        name: editingName.trim(),
        description: editingDescription.trim() || undefined,
        steps,
      };
      if (route) {
        await updateAdminRoute(route.id, payload);
        return { id: route.id, name: payload.name };
      }
      const created = await createAdminRoute(payload);
      updateNodeConfig(nodeId, { routeId: created.id });
      return { id: created.id, name: created.name };
    },
    onSuccess: () => {
      setError('');
      void refresh();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const toggleEnabled = useMutation({
    mutationFn: () => {
      if (!route) throw new Error('route not found');
      return updateAdminRoute(route.id, { enabled: !route.enabled });
    },
    onSuccess: () => void refresh(),
    onError: (err) => setError(errorMessage(err)),
  });

  const pickRoute = (value: string) => {
    if (!value) {
      updateNodeConfig(nodeId, { routeId: '' });
      setRows([]);
      return;
    }
    updateNodeConfig(nodeId, { routeId: value });
    const r = (routes ?? []).find((x) => x.id === value || x.name === value);
    setRows(r ? toRows(r.steps) : []);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-line bg-elevated px-3 py-2 text-[11px] text-faint">
        loading routes…
      </div>
    );
  }

  const allRoutes = routes ?? [];
  const setRow = (index: number, patch: Partial<StepRow>) => {
    const next = [...editing];
    next[index] = { ...next[index], ...patch };
    setRows(next);
  };

  return (
    <div className="space-y-2 rounded-lg border border-line bg-elevated/60 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-inktext">Model route</span>
        {route ? (
          <span className="flex items-center gap-1.5">
            <button
              onClick={() => toggleEnabled.mutate()}
              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                editingEnabled
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
              }`}
            >
              {editingEnabled ? 'enabled' : 'disabled'}
            </button>
            <button
              onClick={() => pickRoute('')}
              title="Detach route"
              className="rounded border border-line px-1.5 py-0.5 text-[9px] text-muted hover:bg-line"
            >
              detach
            </button>
          </span>
        ) : (
          <span className="text-[9px] uppercase tracking-wider text-faint">fallback group</span>
        )}
      </div>

      <div>
        <div className="mb-1 text-[10px] text-faint">Route</div>
        <select
          value={route ? route.id : ''}
          onChange={(e) => pickRoute(e.target.value)}
          className="w-full rounded-lg border border-line bg-ink px-2 py-1.5 text-[11px] text-inktext outline-none focus:border-blue"
        >
          <option value="">— new route —</option>
          {allRoutes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
              {!r.enabled ? ' (disabled)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <label className="block">
          <span className="mb-0.5 block text-[9px] uppercase tracking-wider text-faint">Name</span>
          <input
            value={editingName}
            onChange={(e) => (route ? undefined : setName(e.target.value))}
            disabled={!!route}
            placeholder="route name"
            className="w-full rounded-lg border border-line bg-ink px-2 py-1 text-[11px] text-inktext outline-none placeholder:text-faint focus:border-blue disabled:opacity-50"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] uppercase tracking-wider text-faint">Description</span>
          <input
            value={editingDescription}
            onChange={(e) => (route ? undefined : setDescription(e.target.value))}
            disabled={!!route}
            placeholder="optional"
            className="w-full rounded-lg border border-line bg-ink px-2 py-1 text-[11px] text-inktext outline-none placeholder:text-faint focus:border-blue disabled:opacity-50"
          />
        </label>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] text-faint">Fallback steps</span>
          <button
            onClick={() => setRows([...editing, { provider: '', model: '' }])}
            className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted hover:bg-line"
          >
            + step
          </button>
        </div>
        <div className="space-y-1.5">
          {editing.length === 0 && (
            <p className="rounded border border-dashed border-line px-2 py-1.5 text-[10px] text-faint">
              No steps yet — add a provider/model fallback below.
            </p>
          )}
          {editing.map((step, index) => {
            const row = providerOptions.find((p) => p.value === step.provider);
            return (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-3.5 shrink-0 text-center text-[9px] text-faint">{index + 1}</span>
                <select
                  value={step.provider}
                  onChange={(e) => {
                    setRow(index, { provider: e.target.value, model: '' });
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-ink px-1.5 py-1 text-[10px] text-inktext outline-none focus:border-blue"
                >
                  <option value="">provider…</option>
                  {providerOptions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <select
                  value={step.model}
                  onChange={(e) => setRow(index, { model: e.target.value })}
                  disabled={!row?.models.length}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-ink px-1.5 py-1 text-[10px] text-inktext outline-none focus:border-blue disabled:opacity-40"
                >
                  <option value="">model…</option>
                  {(row?.models ?? []).map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setRows(editing.filter((_, i) => i !== index))}
                  className="shrink-0 rounded px-1 text-[10px] text-red-400 hover:bg-red-500/10"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="w-full rounded-lg border border-blue/40 bg-blue/10 px-2 py-1.5 text-[11px] font-medium text-blue-300 hover:bg-blue/20 disabled:opacity-40"
      >
        {save.isPending ? 'Saving…' : route ? 'Save route' : 'Create route'}
      </button>

      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
