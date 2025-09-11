import type { Post, Profile } from "./schemas.ts";
import { PostSchema, ProfileSchema } from "./schemas.ts";
import type { PageObjectResponse } from "@notionhq/client";

export function rtToPlain(rt: any[]): string {
  return (rt ?? []).map((r: any) => r.plain_text ?? "").join("");
}

export function fileToUrl(file: any): string | undefined {
  if (!file) return undefined;
  if (file.type === "external") return file.external?.url;
  if (file.type === "file") return file.file?.url;
  return undefined;
}

export function getCoverUrl(page: PageObjectResponse): string | undefined {
  const c = (page as any).cover;
  if (!c) return undefined;
  return fileToUrl(c);
}

export function mapPost(page: PageObjectResponse): Post {
  const props: any = page.properties;

  const title = rtToPlain(props?.Title?.title ?? []);
  const slug = (props?.Slug?.rich_text?.[0]?.plain_text ?? props?.Slug?.formula?.string ?? "").trim();
  const status = props?.Status?.select?.name ?? "Draft";
  const publishedAt = props?.PublishedAt?.date?.start ?? null;
  const tags = (props?.Tags?.multi_select ?? []).map((t: any) => t.name);
  const excerpt = props?.Excerpt?.rich_text?.[0]?.plain_text ?? undefined;
  const featured = !!props?.Featured?.checkbox;
  const canonicalURL = props?.CanonicalURL?.url ?? undefined;

  const coverUrl = getCoverUrl(page);
  const readingTimeMinutes = props?.ReadingTime?.number ?? undefined;

  const obj = {
    id: page.id,
    title,
    slug,
    status,
    publishedAt,
    tags,
    excerpt,
    coverUrl,
    featured,
    canonicalURL,
    readingTimeMinutes
  };

  return PostSchema.parse(obj);
}

export function mapProfileFromPage(page: PageObjectResponse, options?: {
  avatarUrl?: string;
  aboutBlocks?: any[];
}): Profile {
  const p: any = page.properties;
  const obj = {
    id: page.id,
    name: rtToPlain(p?.Name?.title ?? []),
    role: p?.Role?.rich_text?.[0]?.plain_text ?? undefined,
    shortBio: p?.ShortBio?.rich_text?.[0]?.plain_text ?? undefined,
    location: p?.Location?.rich_text?.[0]?.plain_text ?? undefined,
    email: p?.Email?.email ?? undefined,
    links: parseLinks(p?.Links),
    avatarUrl: options?.avatarUrl,
    aboutBlocks: options?.aboutBlocks
  };
  return ProfileSchema.parse(obj);
}

function parseLinks(prop: any): Record<string, string> | undefined {
  if (!prop) return undefined;
  const rt = prop.url ? prop.url : rtToPlain(prop.rich_text ?? []);
  if (!rt) return undefined;
  if (rt.startsWith("http")) return { Website: rt };
  const entries = rt.split(",").map((s: string) => s.trim());
  const rec: Record<string, string> = {};
  for (const e of entries) {
    const [k, ...rest] = e.split(":");
    if (k && rest.length) rec[k.trim()] = rest.join(":").trim();
  }
  return Object.keys(rec).length ? rec : undefined;
}
