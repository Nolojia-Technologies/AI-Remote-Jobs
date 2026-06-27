import Link from "next/link";
import { mediaService, STORAGE_BUCKETS, type StorageBucket } from "@/lib/services/media";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ bucket?: string }> }) {
  const sp = await searchParams;
  const bucket = (STORAGE_BUCKETS.includes(sp.bucket as StorageBucket) ? sp.bucket : STORAGE_BUCKETS[0]) as StorageBucket;
  let files: Awaited<ReturnType<typeof mediaService.list>> = [];
  let error: string | null = null;
  try {
    files = await mediaService.list(bucket);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div>
      <PageHeader title="Media Library" description="Supabase Storage buckets (thumbnails, images, certificates, resources, videos)." />

      <div className="mb-4 flex flex-wrap gap-2">
        {STORAGE_BUCKETS.map((b) => (
          <Link key={b} href={`/media?bucket=${b}`}>
            <Badge variant={b === bucket ? "default" : "muted"} className="cursor-pointer">{b}</Badge>
          </Link>
        ))}
      </div>

      {error ? (
        <Card><CardContent className="py-10 text-center text-sm text-destructive">{error}</CardContent></Card>
      ) : files.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No files in “{bucket}”.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((f) => {
            const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name);
            return (
              <a key={f.name} href={f.url} target="_blank" rel="noreferrer" className="group">
                <Card className="overflow-hidden">
                  <div className={cn("flex h-28 items-center justify-center bg-muted", "overflow-hidden")}>
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.url} alt={f.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <span className="text-xs text-muted-foreground">{f.name.split(".").pop()?.toUpperCase()}</span>
                    )}
                  </div>
                  <CardContent className="p-2"><p className="truncate text-xs" title={f.name}>{f.name}</p></CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        TODO: drag-and-drop upload UI. Today, media is added via AI thumbnail generation and lesson resource uploads; all buckets are public-read / admin-write.
      </p>
    </div>
  );
}
