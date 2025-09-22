import { type Experience, ExperienceSchema, type Post, type Profile } from './schemas.ts'
import { PostSchema, ProfileSchema } from './schemas.ts';
import type { PageObjectResponse } from '@notionhq/client';

export function rtToPlain(rt: any[]): string {
  return (rt ?? []).map((r: any) => r.plain_text ?? '').join('');
}

export function fileToUrl(file: any): string | undefined {
  if (!file) return undefined;
  if (file.type === 'external') return file.external?.url;
  if (file.type === 'file') return file.file?.url;
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
  const slug = (
    props?.Slug?.rich_text?.[0]?.plain_text ??
    props?.Slug?.formula?.string ??
    ''
  ).trim();
  const status = props?.Status?.select?.name ?? 'Draft';
  const publishedAt = props?.PublishedAt?.date?.start ?? null;
  const tags = (props?.Tags?.multi_select ?? []).map((t: any) => t.name);
  const excerpt = props?.Excerpt?.rich_text?.[0]?.plain_text ?? undefined;
  const featured = !!props?.Featured?.checkbox;
  const canonicalURL = props?.CanonicalURL?.url ?? undefined;
  const coverUrl = getCoverUrl(page);
  const readingTimeMinutes = props?.ReadingTimeMinutes?.number ?? undefined;

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
    readingTimeMinutes,
  };
  return PostSchema.parse(obj);
}

export function mapExperience(page: PageObjectResponse): Experience {
  const props: any = page.properties;

  const title = rtToPlain(props?.Title?.title ?? []);
  const organization = props?.Organization?.rich_text?.[0]?.plain_text ?? undefined;
  const location = props?.Location?.rich_text?.[0]?.plain_text ?? undefined;
  const start = props?.Start?.rich_text?.[0]?.plain_text ?? undefined;
  const end = props?.End?.rich_text?.[0]?.plain_text ?? undefined;

  const obj = {
    id: page.id,
    title,
    organization,
    location,
    start,
    end,
  }
  return ExperienceSchema.parse(obj);
}

export function mapProfile(page: PageObjectResponse): Profile {
  const props: any = page.properties;

  const name = rtToPlain(props?.Name?.title ?? []);
  const role = props?.Role?.rich_text?.[0]?.plain_text ?? undefined;
  const raised = props?.Raised?.rich_text?.[0]?.plain_text ?? undefined;
  const based = props?.Based?.rich_text?.[0]?.plain_text ?? undefined;
  const email = props?.Email?.email ?? undefined;
  const skills = (props?.Skills?.multi_select ?? []).map((s: any) => s.name);
  const image = props?.Image?.files?.[0]?.file?.url ?? undefined;

  const obj = {
    id: page.id,
    name,
    role,
    raised,
    based,
    email,
    skills,
    image,
  };
  return ProfileSchema.parse(obj);
}
