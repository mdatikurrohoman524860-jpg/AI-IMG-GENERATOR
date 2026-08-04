import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNodeLibrary, syncModelCapabilities } from '../api/admin';
import { errorMessage } from '../api/client';
import type { NodeDefinition } from '../api/types';
import {
  ActionButton,
  Badge,
  ErrorBlock,
  InlineMessage,
  LoadingBlock,
} from '../components/ui';

const libraryKey = ['admin', 'nodes'] as const;

const KIND_TONES: Record<string, 'blue' | 'cyan' | 'amber' | 'neutral' | 'emerald'> = {
  capability: 'blue',
  trigger: 'cyan',
  logic: 'neutral',
  storage: 'amber',
  system: 'neutral',
  canvas: 'neutral',
};

function NodeCard({ node }: { node: NodeDefinition }) {
  const params = useMemo(
    () => (Array.isArray(node.paramSchema) ? node.paramSchema : []),
    [node.paramSchema],
  );
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{node.icon}</span>
            <span className="truncate text-sm font-semibold text-inktext">{node.name}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={KIND_TONES[node.kind] ?? 'neutral'}>{node.kind}</Badge>
            <span className="font-mono text-[10px] text-faint">{node.key}</span>
            {node.hasRuntime === false && <Badge tone="amber">no runtime</Badge>}
          </div>
        </div>
      </div>
      {node.description && (
        <div className="border-t border-line px-3 py-2 text-[11px] text-muted">
          {node.description}
        </div>
      )}
      <div className="border-t border-line px-3 py-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">Ports</div>
        <div className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
          {(Array.isArray(node.inputPorts) ? node.inputPorts : [])
            .filter((p) => p?.id)
            .map((p) => (
              <span key={p.id} className="rounded bg-blue/10 px-1.5 py-0.5 text-blue">
                in:{p.id}
              </span>
            ))}
          {(Array.isArray(node.outputPorts) ? node.outputPorts : [])
            .filter((p) => p?.id)
            .map((p) => (
              <span key={p.id} className="rounded bg-emerald/10 px-1.5 py-0.5 text-emerald">
                out:{p.id}
              </span>
            ))}
        </div>
      </div>
      <div className="border-t border-line px-3 py-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">
          Params ({params.length})
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
          {params.map((p) => (
            <span key={p.key} className="rounded bg-elevated px-1.5 py-0.5 font-mono text-muted">
              {p.key}
            </span>
          ))}
          {params.length === 0 && <span className="text-faint">none</span>}
        </div>
      </div>
    </div>
  );
}

export function NodeLibraryPage() {
  const queryClient = useQueryClient();
  const [group, setGroup] = useState<'capabilities' | 'definitions' | 'providers'>('capabilities');
  const [syncMessage, setSyncMessage] = useState<{ ok: boolean; message: string } | null>(null);

  const library = useQuery({ queryKey: libraryKey, queryFn: fetchNodeLibrary });

  const sync = useMutation({
    mutationFn: syncModelCapabilities,
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: libraryKey });
      setSyncMessage({ ok: true, message: `Synced ${count} model-capability links` });
    },
    onError: (err) => setSyncMessage({ ok: false, message: errorMessage(err) }),
  });

  if (library.isPending) return <LoadingBlock label="Loading node library…" />;
  if (library.isError)
    return <ErrorBlock message="Failed to load node library" onRetry={() => library.refetch()} />;

  const { definitions, capabilities, providers, storageProviders, modelRoutes } = library.data;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Node Library</h1>
          <p className="mt-1 text-sm text-muted">
            Live node registry served by the backend — the workflow builder is generated from these
            definitions.
          </p>
        </div>
        <ActionButton onClick={() => sync.mutate()} disabled={sync.isPending}>
          {sync.isPending ? 'Syncing…' : 'Sync model capabilities'}
        </ActionButton>
      </div>

      {syncMessage && (
        <div className="mt-3">
          <InlineMessage message={syncMessage.message} tone={syncMessage.ok ? 'success' : 'error'} />
        </div>
      )}

      <div className="mt-5 flex gap-1 rounded-xl border border-line bg-surface p-1">
        {(
          [
            ['capabilities', `Capabilities (${capabilities.length})`],
            ['definitions', `Nodes (${definitions.length})`],
            ['providers', `Sources (${providers.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setGroup(key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              group === key ? 'bg-blue/15 text-blue' : 'text-muted hover:bg-elevated'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {group !== 'providers' && (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(group === 'capabilities' ? capabilities : definitions).map((node) => (
            <NodeCard key={node.key} node={node} />
          ))}
        </div>
      )}

      {group === 'providers' && (
        <div className="mt-5 space-y-3">
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="text-xs font-semibold text-inktext">
              Providers ({providers.length})
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {providers.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-[11px] text-muted"
                >
                  {p.displayName}
                  <span className="font-mono text-faint">{p.name}</span>
                  <Badge tone={p.enabled ? 'emerald' : 'neutral'}>
                    {p.enabled ? 'enabled' : 'disabled'}
                  </Badge>
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="text-xs font-semibold text-inktext">
              Storage providers ({storageProviders.length})
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {storageProviders.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-[11px] text-muted"
                >
                  {p.name}
                  <Badge tone="neutral">{p.driver}</Badge>
                  {p.isActive && <Badge tone="emerald">active</Badge>}
                  {!p.configConfigured && <Badge tone="amber">no config</Badge>}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="text-xs font-semibold text-inktext">
              Model routes ({modelRoutes.length})
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {modelRoutes.map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-[11px] text-muted"
                >
                  {r.name}
                  <Badge tone={r.enabled ? 'emerald' : 'neutral'}>
                    {r.enabled ? 'enabled' : 'disabled'}
                  </Badge>
                </span>
              ))}
              {modelRoutes.length === 0 && (
                <span className="text-[11px] text-faint">no routes yet</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
