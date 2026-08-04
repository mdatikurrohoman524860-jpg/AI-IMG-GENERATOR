import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteStorageAsset,
  fetchStorageAssetFile,
  fetchStorageAssets,
} from '../api/admin';
import type { StorageAsset } from '../api/types';
import {
  Badge,
  ConfirmDialog,
  ErrorBlock,
  formatDate,
  LoadingBlock,
} from '../components/ui';

const assetsKey = ['admin', 'storage', 'assets'] as const;

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

export function StoragePage() {
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
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Storage</h1>
          <p className="mt-1 text-sm text-muted">
            Assets persisted by storage nodes. Local driver by default — S3/R2 settings live in
            Settings → Storage.
          </p>
        </div>
        <Badge tone="neutral">{assets.data.length} assets</Badge>
      </div>

      {assets.data.length === 0 && (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-10 text-center text-sm text-faint">
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
