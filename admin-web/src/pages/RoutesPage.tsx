import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminRoute,
  deleteAdminRoute,
  fetchAdminProviders,
  fetchAdminRoutes,
  updateAdminRoute,
} from '../api/admin';
import { errorMessage } from '../api/client';
import type { ModelRoute, ModelRouteStep } from '../api/types';
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

const routesKey = ['admin', 'routes'] as const;

interface StepRow {
  provider: string;
  model: string;
  priority: number;
}

interface RouteForm {
  name: string;
  description: string;
  steps: StepRow[];
}

function toStepRows(steps: unknown): StepRow[] {
  if (!Array.isArray(steps)) return [];
  return steps
    .filter(
      (s): s is { provider?: unknown; model?: unknown; priority?: unknown } =>
        typeof s === 'object' && s !== null,
    )
    .map((s) => ({
      provider: typeof s.provider === 'string' ? s.provider : '',
      model: typeof s.model === 'string' ? s.model : '',
      priority: typeof s.priority === 'number' ? s.priority : 0,
    }));
}

function RouteEditor({
  route,
  onClose,
}: {
  route: ModelRoute | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RouteForm>({
    name: route?.name ?? '',
    description: route?.description ?? '',
    steps: toStepRows(route?.steps),
  });
  const [error, setError] = useState('');

  const providers = useQuery({ queryKey: ['admin', 'providers'], queryFn: fetchAdminProviders });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('name is required');
      const steps: ModelRouteStep[] = form.steps
        .filter((s) => s.provider.trim() && s.model.trim())
        .map((s) => ({
          provider: s.provider.trim(),
          model: s.model.trim(),
          priority: s.priority,
        }));
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        steps,
      };
      if (route) {
        await updateAdminRoute(route.id, payload);
      } else {
        await createAdminRoute(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routesKey });
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const providerOptions =
    providers.data?.flatMap((p) =>
      p.models.map((m) => ({
        provider: p.name,
        model: m.internalName,
        label: `${p.displayName} / ${m.displayName}`,
      })),
    ) ?? [];

  const setStep = (index: number, patch: Partial<StepRow>) => {
    const next = [...form.steps];
    next[index] = { ...next[index], ...patch };
    setForm({ ...form, steps: next });
  };

  return (
    <Modal open title={route ? `Edit ${route.name}` : 'New model route'} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. image-fallback"
              className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Description</span>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="optional"
              className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
            />
          </label>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">
              Fallback steps (ordered)
            </span>
            <button
              onClick={() =>
                setForm({
                  ...form,
                  steps: [...form.steps, { provider: '', model: '', priority: form.steps.length }],
                })
              }
              className="rounded-lg border border-line px-2 py-1 text-[11px] text-muted hover:bg-elevated"
            >
              + Add step
            </button>
          </div>
          <div className="space-y-2">
            {form.steps.length === 0 && (
              <div className="rounded-lg border border-dashed border-line py-3 text-center text-[11px] text-faint">
                No steps — the route will match nothing. Add provider/model fallbacks above.
              </div>
            )}
            {form.steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2 rounded-lg border border-line bg-elevated p-2">
                <span className="w-4 text-center text-[11px] text-faint">{index + 1}</span>
                <select
                  value={step.provider}
                  onChange={(e) => setStep(index, { provider: e.target.value })}
                  className="flex-1 rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-inktext outline-none focus:border-blue"
                >
                  <option value="">provider…</option>
                  {providerOptions.map((opt) => (
                    <option key={`${opt.provider}/${opt.model}`} value={opt.provider}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={step.model}
                  onChange={(e) => setStep(index, { model: e.target.value })}
                  className="flex-1 rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-inktext outline-none focus:border-blue"
                >
                  <option value="">model…</option>
                  {providerOptions
                    .filter((opt) => opt.provider === step.provider)
                    .map((opt) => (
                      <option key={opt.model} value={opt.model}>
                        {opt.model}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => setForm({ ...form, steps: form.steps.filter((_, i) => i !== index) })}
                  className="rounded px-1.5 py-0.5 text-[11px] text-red-400 hover:bg-red-500/10"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <ActionButton onClick={onClose}>Cancel</ActionButton>
        <ActionButton tone="primary" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : route ? 'Save' : 'Create route'}
        </ActionButton>
      </div>
      <InlineMessage message={error} tone="error" />
    </Modal>
  );
}

function RouteRow({ route }: { route: ModelRoute }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: routesKey });

  const toggleEnabled = useMutation({
    mutationFn: () => updateAdminRoute(route.id, { enabled: !route.enabled }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: () => deleteAdminRoute(route.id),
    onSuccess: () => {
      invalidate();
      setDeleting(false);
    },
  });

  const steps = toStepRows(route.steps);

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-inktext">{route.name}</span>
            <Badge tone={route.enabled ? 'emerald' : 'neutral'}>
              {route.enabled ? 'enabled' : 'disabled'}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-faint">
            {route.description && <span className="truncate">{route.description}</span>}
            {route.description && steps.length > 0 && <span>·</span>}
            <span>{steps.length} step{steps.length === 1 ? '' : 's'}</span>
            <span>·</span>
            <span>updated {formatDate(route.updatedAt)}</span>
          </div>
        </div>
        <ActionButton onClick={() => setEditing(true)}>Edit</ActionButton>
        <button
          onClick={() => setDeleting(true)}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
        >
          Delete
        </button>
        <Toggle checked={route.enabled} onChange={() => toggleEnabled.mutate()} />
      </div>

      {steps.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-2.5">
          {steps.map((step, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-elevated px-2 py-1 text-[11px] text-muted"
            >
              <span className="text-faint">{index + 1}.</span>
              <span className="font-mono text-inktext">{step.provider}</span>
              <span>/</span>
              <span className="font-mono text-inktext">{step.model}</span>
            </span>
          ))}
        </div>
      )}

      {editing && <RouteEditor route={route} onClose={() => setEditing(false)} />}

      <ConfirmDialog
        open={deleting}
        title="Delete route"
        description={
          <>
            Delete <span className="font-mono text-inktext">{route.name}</span>? Workflow nodes bound
            to this route will have no fallback group.
          </>
        }
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
        onClose={() => setDeleting(false)}
      />
    </div>
  );
}

export function RoutesPage() {
  const [creating, setCreating] = useState(false);

  const routes = useQuery({ queryKey: routesKey, queryFn: fetchAdminRoutes });

  if (routes.isPending) return <LoadingBlock label="Loading model routes…" />;
  if (routes.isError)
    return <ErrorBlock message="Failed to load model routes" onRetry={() => routes.refetch()} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Model Routes</h1>
          <p className="mt-1 text-sm text-muted">
            Ordered provider/model fallback groups. A modelRoute node (or a tool default) points at
            a route — the engine walks its steps in order.
          </p>
        </div>
        <ActionButton tone="primary" onClick={() => setCreating(true)}>
          + New route
        </ActionButton>
      </div>

      {routes.data.length === 0 && (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-10 text-center text-sm text-faint">
          No routes yet — create one to give workflows a provider fallback group.
        </div>
      )}

      <div className="mt-5 space-y-3">
        {routes.data.map((route) => (
          <RouteRow key={route.id} route={route} />
        ))}
      </div>

      {creating && <RouteEditor route={null} onClose={() => setCreating(false)} />}
    </div>
  );
}
