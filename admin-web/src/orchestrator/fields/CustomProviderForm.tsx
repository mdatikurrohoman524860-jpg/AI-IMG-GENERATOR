import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAdminProvider } from '../../api/admin';
import { errorMessage } from '../../api/client';
import { useNodeLibraryStore } from '../dynamicLibrary';

const inputBase =
  'w-full rounded-lg border border-line bg-ink px-2 py-1 text-[11px] text-inktext outline-none placeholder:text-faint focus:border-blue';

export type CustomProviderCapability = 'image' | 'video' | 'text';

/**
 * Inline "custom provider" creator for the workflow builder. Creates a real
 * provider row (+ model + API key) through the admin API, then reloads the
 * node library so the new provider is immediately selectable.
 */
export function CustomProviderForm({
  capability = 'text',
  onCreate,
}: {
  capability?: CustomProviderCapability;
  onCreate: (providerName: string, modelName: string) => void;
}) {
  const queryClient = useQueryClient();
  const reloadLibrary = useNodeLibraryStore((s) => s.reload);
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    baseUrl: '',
    modelName: '',
    apiKey: '',
    priority: '100',
    maxRpm: '60',
    maxTpm: '100000',
  });

  const submit = useMutation({
    mutationFn: async () => {
      const name = form.name.trim().toLowerCase().replace(/\s+/g, '-');
      const displayName = form.displayName.trim() || name;
      const baseUrl = form.baseUrl.trim();
      const modelName = form.modelName.trim();
      if (!name) throw new Error('Provider name is required');
      if (!/^[a-z0-9-]+$/.test(name)) {
        throw new Error('Provider name: lowercase letters, numbers, dashes only');
      }
      if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
        throw new Error('Endpoint URL must start with http(s)://');
      }
      if (!modelName) throw new Error('AI model name is required');
      await createAdminProvider({
        name,
        displayName,
        baseUrl,
        enabled: true,
        supportsImages: capability === 'image',
        supportsVideo: capability === 'video',
        priority: Number(form.priority) || 100,
        maxRpm: Math.max(1, Number(form.maxRpm) || 60),
        maxTpm: Math.max(1, Number(form.maxTpm) || 100000),
        apiKey: form.apiKey.trim() || undefined,
        models: [
          {
            displayName: modelName,
            internalName: modelName,
            enabled: true,
            supportsImages: capability === 'image',
            supportsVideo: capability === 'video',
          },
        ],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      await reloadLibrary();
      return { name, modelName };
    },
    onSuccess: ({ name, modelName }) => onCreate(name, modelName),
  });

  return (
    <div className="space-y-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
          New custom provider
        </span>
        <span className="text-[9px] text-faint">{capability}</span>
      </div>
      <label className="block">
        <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">Provider name</span>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="my-provider (lowercase, dashes)"
          className={inputBase}
        />
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">Display name</span>
          <input
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="My Provider"
            className={inputBase}
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">AI model name</span>
          <input
            value={form.modelName}
            onChange={(e) => setForm({ ...form, modelName: e.target.value })}
            placeholder="flux.1-dev"
            className={inputBase}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">
          Endpoint URL
        </span>
        <input
          value={form.baseUrl}
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
          placeholder="https://api.example.com/v1"
          className={inputBase}
        />
      </label>
      <label className="block">
        <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">API key</span>
        <input
          type="password"
          value={form.apiKey}
          onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
          placeholder="sk-… (optional)"
          className={inputBase}
        />
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">Priority</span>
          <input
            type="number"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className={inputBase}
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">Max PRM</span>
          <input
            type="number"
            value={form.maxRpm}
            onChange={(e) => setForm({ ...form, maxRpm: e.target.value })}
            className={inputBase}
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-faint">Max TPM</span>
          <input
            type="number"
            value={form.maxTpm}
            onChange={(e) => setForm({ ...form, maxTpm: e.target.value })}
            className={inputBase}
          />
        </label>
      </div>
      <button
        onClick={() => submit.mutate()}
        disabled={submit.isPending}
        className="w-full rounded-lg bg-cyan-500 px-2 py-1 text-[11px] font-medium text-white hover:bg-cyan-400 disabled:opacity-40"
      >
        {submit.isPending ? 'creating…' : '＋ Create provider'}
      </button>
      {submit.isError && (
        <p className="text-[10px] text-red-400">{errorMessage(submit.error)}</p>
      )}
    </div>
  );
}
