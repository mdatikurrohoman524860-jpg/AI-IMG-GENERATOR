import { useMemo, useState } from 'react';
import { getNodeDefinition, toolKeyForNodeType } from '../nodeRegistry';
import { useWorkflowStore, statusColor, type FlowNode } from '../store/workflowStore';
import { FieldEditor } from '../fields/FieldEditor';
import { ProviderCredentialEditor } from '../fields/ProviderCredentialEditor';
import { ChainEditor, type ChainCapability } from './ChainEditor';
import { RouteEditorPanel } from './RouteEditorPanel';
import { StorageStatus } from './StorageStatus';

function capabilityFor(nodeType: string): ChainCapability {
  return nodeType === 'videoModel' ? 'video' : 'image';
}

const MODEL_NODE_TYPES = new Set([
  'imageModel', 'imageGeneration',
  'iconModel', 'iconGeneration',
  'logoModel', 'logoGeneration',
  'object3dModel', 'object3dGeneration',
  'videoModel', 'videoGeneration',
  'chatModel', 'textGeneration',
]);

function clientModelStep(nodes: FlowNode[]): { provider: string; model: string } | null {
  for (const n of nodes) {
    if (!MODEL_NODE_TYPES.has(n.data.type)) continue;
    const chain = Array.isArray(n.data.config.chain) ? (n.data.config.chain as Array<Record<string, unknown>>) : [];
    for (const s of chain) {
      if (
        typeof s?.provider === 'string' && s.provider.trim() &&
        typeof s?.model === 'string' && s.model.trim()
      ) {
        return { provider: s.provider.trim(), model: s.model.trim() };
      }
    }
    if (typeof n.data.config.provider === 'string' && n.data.config.provider.trim()) {
      return {
        provider: n.data.config.provider.trim(),
        model: typeof n.data.config.model === 'string' ? n.data.config.model.trim() : '',
      };
    }
    return null;
  }
  return null;
}

export function PropertiesPanel() {
  const selected = useWorkflowStore((s) => s.selected);
  const nodes = useWorkflowStore((s) => s.nodes);
  const updateNodeConfig = useWorkflowStore((s) => s.updateNodeConfig);
  const renameNode = useWorkflowStore((s) => s.renameNode);
  const deleteNodes = useWorkflowStore((s) => s.deleteNodes);
  const duplicateNodes = useWorkflowStore((s) => s.duplicateNodes);
  const setSelected = useWorkflowStore((s) => s.setSelected);
  const nodeStatuses = useWorkflowStore((s) => s.nodeStatuses);
  const [localName, setLocalName] = useState<string | null>(null);
  const [keyProvider, setKeyProvider] = useState('');

  const selectedNodes = nodes.filter((n) => selected.includes(n.id));
  const selNode = selectedNodes[0];

  const chainProviders = useMemo(() => {
    if (!selNode) return [];
    const chain = Array.isArray(selNode.data.config.chain) ? selNode.data.config.chain : [];
    const seen = new Set<string>();
    const list: string[] = [];
    for (const s of chain) {
      if (typeof s?.provider === 'string' && s.provider && !seen.has(s.provider)) {
        seen.add(s.provider);
        list.push(s.provider);
      }
    }
    return list;
  }, [selNode]);

  if (!selected.length || !selectedNodes.length) {
    return (
      <aside className="flex w-72 shrink-0 flex-col border-l border-line bg-ink/90">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted">Properties</h3>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
            <span className="text-3xl opacity-40">◈</span>
            <p className="text-xs leading-relaxed text-faint">
              Select a node to edit its settings.
              <br />
              Click empty canvas to clear the selection.
            </p>
          </div>
          <WorkflowPublishSection />
        </div>
      </aside>
    );
  }

  const node = selNode;
  const def = getNodeDefinition(node.data.type);
  const meta = def.category === 'AI' || def.category === 'Provider'
    ? { color: 'text-cyan-400' }
    : { color: 'text-slate-400' };
  const toolKey = toolKeyForNodeType(node.data.type);
  const status = nodeStatuses[node.id];
  const multiple = selectedNodes.length > 1;
  const name = localName ?? node.data.name;

  const nodeType = node.data.type;

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-line bg-ink/90">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted">
          {multiple ? `Selection (${selectedNodes.length})` : 'Properties'}
        </h3>
        {!multiple && (
          <span className={`text-[11px] font-medium ${meta.color}`}>{def.category}</span>
        )}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {multiple ? (
          <p className="text-xs text-muted">
            {selectedNodes.length} nodes selected. Batch actions below.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg ${def.color}`}>
                {def.icon}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-inktext">{def.label}</p>
                <p className="text-[10px] text-faint">type: {def.type}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted">{def.description}</p>

            {status && (
              <div className="flex items-center gap-2 rounded-lg border border-line bg-elevated px-3 py-2 text-xs">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: statusColor[status.status] ?? '#3b82f6' }}
                />
                <span className="capitalize text-muted">{status.status}</span>
                <span className="ml-auto tabular-nums text-faint">{status.runtimeMs} ms</span>
              </div>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">Name</span>
                <input
                  value={name}
                  onChange={(e) => setLocalName(e.target.value)}
                  onBlur={() => {
                    if (localName !== null && localName.trim() !== node.data.name) {
                      renameNode(node.id, localName.trim() || def.label);
                    }
                    setLocalName(null);
                  }}
                  className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none focus:border-blue"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">💬 Comment</span>
                <textarea
                  value={typeof node.data.config.comment === 'string' ? node.data.config.comment : ''}
                  onChange={(e) => updateNodeConfig(node.id, { comment: e.target.value })}
                  rows={2}
                  placeholder="Notes for collaborators…"
                  className="w-full resize-none rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">Enabled</span>
                <button
                  onClick={() => updateNodeConfig(node.id, { enabled: !(node.data.config.enabled !== false) })}
                  className={`relative h-5 w-9 rounded-full transition-colors ${node.data.config.enabled !== false ? 'bg-blue-500' : 'bg-line'}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${node.data.config.enabled !== false ? 'left-[18px]' : 'left-0.5'}`}
                  />
                </button>
              </label>

              <div>
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-faint">
                  Settings
                </span>
                <div className="space-y-3">
                  {toolKey ? (
                    <>
                      <ChainEditor nodeId={node.id} capability={capabilityFor(nodeType)} />
                      {def.fields
                        .filter((f) => f.key !== 'provider' && f.key !== 'model')
                        .map((field) => (
                          <label key={field.key} className="block">
                            <span className="mb-1 block text-[11px] text-muted">{field.label}</span>
                            <FieldEditor
                              field={field}
                              value={node.data.config[field.key]}
                              sourceContext={node.data.config.provider}
                              onChange={(value) => updateNodeConfig(node.id, { [field.key]: value })}
                            />
                          </label>
                        ))}
                      {chainProviders.length > 0 && (
                        <div className="space-y-2 border-t border-line pt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">
                              Provider keys
                            </span>
                            <select
                              value={chainProviders.includes(keyProvider) ? keyProvider : chainProviders[0]}
                              onChange={(e) => setKeyProvider(e.target.value)}
                              className="min-w-0 flex-1 rounded-lg border border-line bg-ink px-2 py-1 text-[10px] text-inktext outline-none focus:border-blue"
                            >
                              {chainProviders.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>
                          <ProviderCredentialEditor
                            providerName={chainProviders.includes(keyProvider) ? keyProvider : chainProviders[0]}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    def.fields.map((field) =>
                      nodeType === 'modelRoute' && field.key === 'routeId' ? null : (
                        <label key={field.key} className="block">
                          <span className="mb-1 block text-[11px] text-muted">{field.label}</span>
                          <FieldEditor
                            field={field}
                            value={node.data.config[field.key]}
                            sourceContext={node.data.config.provider}
                            onChange={(value) => updateNodeConfig(node.id, { [field.key]: value })}
                          />
                        </label>
                      ),
                    )
                  )}

                  {nodeType === 'modelRoute' && <RouteEditorPanel nodeId={node.id} />}

                  {nodeType === 'modelNode' &&
                    typeof node.data.config.provider === 'string' &&
                    node.data.config.provider && (
                      <div className="space-y-1">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-faint">
                          Provider key
                        </span>
                        <ProviderCredentialEditor
                          providerName={node.data.config.provider}
                          modelValue={typeof node.data.config.model === 'string' ? node.data.config.model : ''}
                          onModelChange={(model) => updateNodeConfig(node.id, { model })}
                          onProviderSelect={(provider) =>
                            updateNodeConfig(node.id, { provider, model: '' })
                          }
                        />
                      </div>
                    )}

                  {nodeType === 'storageNode' && (
                    <StorageStatus storageName={String(node.data.config.storage ?? '')} />
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2 border-t border-line pt-4">
          <button
            onClick={() => duplicateNodes(selectedNodes.map((n) => n.id))}
            className="flex-1 rounded-lg border border-line bg-elevated px-3 py-1.5 text-xs font-medium text-inktext hover:border-blue/40"
          >
            ⧉ Duplicate
          </button>
          <button
            onClick={() => deleteNodes(selectedNodes.map((n) => n.id))}
            className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
          >
            ✕ Delete
          </button>
        </div>
        <button
          onClick={() => setSelected([])}
          className="w-full rounded-lg px-3 py-1.5 text-[11px] text-faint hover:bg-elevated hover:text-muted"
        >
          Deselect
        </button>
      </div>
    </aside>
  );
}

function WorkflowPublishSection() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const clientEnabled = useWorkflowStore((s) => s.workflowClientEnabled);
  const clientModelName = useWorkflowStore((s) => s.workflowClientModelName);
  const setClientEnabled = useWorkflowStore((s) => s.setWorkflowClientEnabled);
  const setClientModelName = useWorkflowStore((s) => s.setWorkflowClientModelName);

  const step = useMemo(() => clientModelStep(nodes), [nodes]);

  return (
    <div className="rounded-xl border border-line bg-elevated p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">
          Publish to client site
        </span>
        <button
          onClick={() => setClientEnabled(!clientEnabled)}
          className={`relative h-5 w-9 rounded-full transition-colors ${clientEnabled ? 'bg-blue-500' : 'bg-line'}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${clientEnabled ? 'left-[18px]' : 'left-0.5'}`}
          />
        </button>
      </div>

      {clientEnabled && (
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">
              Public model name
            </span>
            <input
              value={clientModelName}
              onChange={(e) => setClientModelName(e.target.value)}
              placeholder="e.g. Aurora XL"
              className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue"
            />
          </label>
          {step ? (
            <div className="rounded-lg border border-line bg-ink px-3 py-2 text-[11px] text-muted">
              Exposes <span className="font-medium text-inktext">{step.model || 'default model'}</span> via{' '}
              <span className="font-medium text-inktext">{step.provider}</span>
              <span className="block pt-0.5 text-faint">
                Listed on the client site only if the provider is healthy and the model is enabled.
              </span>
            </div>
          ) : (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400">
              No model node found. Add an image / video / text generation node to publish this workflow.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
