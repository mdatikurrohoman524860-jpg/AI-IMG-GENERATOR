import { create } from 'zustand';
import { api } from '../api/client';
import {
  mergeDynamicDefinitions,
  CAPABILITY_NODE_TYPE_BY_KEY,
  type NodeDefinition,
  type NodeField,
} from './nodeRegistry';

export interface LibraryProvider {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  apiKeyConfigured: boolean;
  supportsImages?: boolean;
  supportsVision?: boolean;
  supportsVideo?: boolean;
  models: Array<{
    id: string;
    displayName: string;
    internalName: string;
    enabled: boolean;
    supportsImages?: boolean;
    supportsVision?: boolean;
    supportsVideo?: boolean;
  }>;
}

export interface LibraryStorageProvider {
  id: string;
  name: string;
  driver: string;
  enabled: boolean;
  isActive: boolean;
  priority: number;
  configConfigured: boolean;
}

export interface LibraryModelRoute {
  id: string;
  name: string;
  enabled: boolean;
}

export interface LibraryCapability {
  key: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  category: string;
  paramSchema: Array<Record<string, unknown>>;
  defaults: Record<string, unknown>;
  hasRuntime: boolean;
  enabled: boolean;
}

interface NodeLibraryPayload {
  definitions: Array<{
    key: string;
    kind: string;
    category: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
    inputPorts: Array<{ id: string; label: string; dataType: string }>;
    outputPorts: Array<{ id: string; label: string; dataType: string }>;
    paramSchema: Array<Record<string, unknown>>;
    defaults: Record<string, unknown>;
    enabled: boolean;
  }>;
  capabilities: LibraryCapability[];
  providers: LibraryProvider[];
  storageProviders: LibraryStorageProvider[];
  modelRoutes: LibraryModelRoute[];
}

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface NodeLibraryState {
  status: LoadStatus;
  error: string | null;
  /** Dynamic node definitions merged over the static registry (reactive). */
  definitions: NodeDefinition[];
  providers: LibraryProvider[];
  storageProviders: LibraryStorageProvider[];
  modelRoutes: LibraryModelRoute[];
  capabilities: LibraryCapability[];
  loaded: boolean;
  load: () => Promise<void>;
  /** Re-fetch from the backend (after inline credential / route / provider edits). */
  reload: () => Promise<void>;
}

const FIELD_TYPES: Record<string, NodeField['type']> = {
  text: 'text',
  number: 'number',
  select: 'select',
  toggle: 'toggle',
  slider: 'slider',
  textarea: 'textarea',
  file: 'text',
};

function toField(f: Record<string, unknown>): NodeField {
  const key = String(f.key ?? '');
  const type = FIELD_TYPES[String(f.type ?? 'text')] ?? 'text';
  const options = Array.isArray(f.options)
    ? (f.options as string[]).map((o) => String(o))
    : undefined;
  const field: NodeField = {
    key,
    label: String(f.label ?? key),
    type,
    ...(options?.length ? { options } : {}),
    ...(typeof f.min === 'number' ? { min: f.min } : {}),
    ...(typeof f.max === 'number' ? { max: f.max } : {}),
    ...(typeof f.step === 'number' ? { step: f.step } : {}),
    ...(typeof f.placeholder === 'string' ? { placeholder: f.placeholder } : {}),
  };
  return field;
}

function definitionRowToNodeDefinition(
  row: NodeLibraryPayload['definitions'][number],
): NodeDefinition {
  const def: NodeDefinition = {
    type: row.key,
    category: row.category as NodeDefinition['category'],
    label: row.name,
    description: row.description ?? '',
    icon: row.icon,
    color: row.color,
    defaults: row.defaults ?? {},
    fields: (row.paramSchema ?? []).map(toField),
    outputHandles: row.key === 'subscriptionCheck' ? 'if' : 'single',
    inputHandles: 'single',
  };
  if (row.key === 'modelNode') {
    def.fields = def.fields.map((f) =>
      f.key === 'provider'
        ? { ...f, source: 'providers' }
        : f.key === 'model'
          ? { ...f, source: 'models' }
          : f,
    );
  }
  if (row.key === 'modelRoute') {
    def.fields = def.fields.map((f) =>
      f.key === 'routeId' ? { ...f, source: 'routes' } : f,
    );
  }
  if (row.key === 'storageNode') {
    def.fields = def.fields.map((f) =>
      f.key === 'storage' ? { ...f, source: 'storageProviders' } : f,
    );
  }
  return def;
}

function capabilityToNodeDefinition(cap: LibraryCapability): NodeDefinition | null {
  const type = CAPABILITY_NODE_TYPE_BY_KEY[cap.key] ?? cap.key;
  return {
    type,
    category: 'AI',
    label: cap.name,
    description: cap.description ?? '',
    icon: cap.icon,
    color: cap.color,
    defaults: cap.defaults ?? {},
    fields: (cap.paramSchema ?? []).map(toField),
    outputHandles: 'single',
    inputHandles: 'single',
    simulate: cap.hasRuntime,
  };
}

export const useNodeLibraryStore = create<NodeLibraryState>((set) => ({
  status: 'idle',
  error: null,
  definitions: [],
  providers: [],
  storageProviders: [],
  modelRoutes: [],
  capabilities: [],
  loaded: false,
  load: async () => {
    set({ status: 'loading' });
    try {
      const { data } = await api.get<NodeLibraryPayload>('/admin/nodes');
      const defs: NodeDefinition[] = [];
      for (const row of data.definitions) {
        if (row.enabled === false) continue;
        defs.push(definitionRowToNodeDefinition(row));
      }
      for (const cap of data.capabilities) {
        if (cap.enabled === false) continue;
        const def = capabilityToNodeDefinition(cap);
        if (def) defs.push(def);
      }
      mergeDynamicDefinitions(defs);
      set({
        status: 'ready',
        error: null,
        definitions: defs,
        providers: data.providers ?? [],
        storageProviders: data.storageProviders ?? [],
        modelRoutes: data.modelRoutes ?? [],
        capabilities: data.capabilities ?? [],
        loaded: true,
      });
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  },
  reload: async () => {
    await useNodeLibraryStore.getState().load();
  },
}));

/** Kick off a load once (module-level guard — call from NodeLibrary). */
let loadStarted = false;
export function ensureNodeLibraryLoaded(): void {
  if (loadStarted) return;
  loadStarted = true;
  void useNodeLibraryStore.getState().load();
}
