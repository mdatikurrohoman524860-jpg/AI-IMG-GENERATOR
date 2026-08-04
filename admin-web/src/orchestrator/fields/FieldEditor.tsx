import { useId } from 'react';
import type { NodeField } from '../nodeRegistry';
import { useNodeLibraryStore } from '../dynamicLibrary';

function useSourceOptions(source: NodeField['source'], sourceContext: unknown) {
  const providers = useNodeLibraryStore((s) => s.providers);
  const storageProviders = useNodeLibraryStore((s) => s.storageProviders);
  const modelRoutes = useNodeLibraryStore((s) => s.modelRoutes);

  if (source === 'providers') {
    const sorted = [...providers].sort(
      (a, b) => Number(b.enabled && b.apiKeyConfigured) - Number(a.enabled && a.apiKeyConfigured),
    );
    return sorted.map((p) => ({ value: p.name, label: p.displayName || p.name }));
  }
  if (source === 'models') {
    const providerName = String(sourceContext ?? '');
    const provider = providers.find((p) => p.name === providerName || p.displayName === providerName);
    if (!provider?.models?.length) return [];
    return provider.models.map((m) => ({
      value: m.internalName,
      label: m.displayName || m.internalName,
    }));
  }
  if (source === 'routes') {
    return modelRoutes.map((r) => ({ value: r.name, label: r.name }));
  }
  if (source === 'storageProviders') {
    const sorted = [...storageProviders].sort((a, b) => Number(b.isActive) - Number(a.isActive));
    return sorted.map((p) => ({ value: p.name, label: `${p.name} (${p.driver})` }));
  }
  return [];
}

export function FieldEditor({
  field,
  value,
  onChange,
  sourceContext,
}: {
  field: NodeField;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Used by source='models' — the provider currently selected on the node. */
  sourceContext?: unknown;
}) {
  const base =
    'w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-inktext outline-none placeholder:text-faint focus:border-blue';
  const datalistId = useId();
  const sourceOptions = useSourceOptions(field.source, sourceContext);

  if (field.source) {
    if (!sourceOptions.length) {
      return (
        <>
          <input
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? '— none configured —'}
            className={base}
          />
          <p className="mt-1 text-[9px] text-faint">No {field.source} configured in Admin.</p>
        </>
      );
    }
    return (
      <>
        <input
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          list={datalistId}
          className={base}
        />
        <datalist id={datalistId}>
          {sourceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </datalist>
        {value && !sourceOptions.some((o) => o.value === value) && (
          <p className="mt-1 text-[9px] text-amber-300/70">Custom value — not in the live list.</p>
        )}
      </>
    );
  }

  if (field.type === 'toggle') {
    return (
      <button
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-line'}`}
        title="Toggle"
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${value ? 'left-[18px]' : 'left-0.5'}`}
        />
      </button>
    );
  }
  if (field.type === 'select') {
    return (
      <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={base}>
        {field.options?.map((o) => (
          <option key={o} value={o} className="bg-elevated">
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === 'textarea') {
    return (
      <textarea
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={field.placeholder}
        className={`${base} resize-none`}
      />
    );
  }
  if (field.type === 'slider') {
    const num = Number(value ?? field.min ?? 0);
    return (
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={num}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-blue-500"
        />
        <span className="w-10 text-right text-[11px] tabular-nums text-muted">{num}</span>
      </div>
    );
  }
  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={Number(value ?? 0)}
        min={field.min}
        max={field.max}
        step={field.step}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className={base}
      />
    );
  }
  return (
    <input
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={base}
    />
  );
}
