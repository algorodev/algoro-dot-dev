import path from 'node:path';
import { downloadFile } from '@lib/fs/download';
import { NOTION_PUBLIC_DIR } from '@lib/fs/paths';

function esc(text = '') {
  return text
    .replaceAll('{', '\\{')
    .replaceAll('}', '\\}')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function richTextToInline(rt: any[]): string {
  return (rt ?? [])
    .map((r) => {
      const t = r?.plain_text ?? '';
      const ann = r?.annotations ?? {};
      let out = esc(t);
      if (ann.code) out = '`' + out + '`';
      if (ann.bold) out = `**${out}**`;
      if (ann.italic) out = `*${out}*`;
      if (ann.strikethrough) out = `~~${out}~~`;
      if (ann.underline) out = `<u>${out}</u>`;
      if (r?.href) out = `[${out}](${r.href})`;
      return out;
    })
    .join('');
}

export type ImageDownload = {
  url: string;
  localRelPath: string;
  localAbsPath: string;
};

async function materializeImage(pageId: string, url: string, idx: number): Promise<ImageDownload> {
  const ext = (() => {
    try {
      const u = new URL(url);
      const m = u.pathname.match(/\\.(\\w+)(?:\\?|$)/);
      return m ? m[1] : 'png';
    } catch { return 'png'; }
  })();
  const fname = `img-${idx}.${ext}`;
  const rel = `/notion/${pageId}/${fname}`;
  const abs = path.join(NOTION_PUBLIC_DIR, pageId, fname);
  await downloadFile(url, abs);
  return { url, localRelPath: rel, localAbsPath: abs };
}

export async function blocksToMDX(pageId: string, blocks: any[], options?: {
  coverUrl?: string;
}): Promise<{ mdx: string; coverPath?: string }> {
  let mdx: string[] = [];
  let imageCount = 0;
  let localCover: string | undefined;

  // Cover
  if (options?.coverUrl) {
    const cover = await materializeImage(pageId, options.coverUrl, ++imageCount);
    localCover = cover.localRelPath;
  }

  for (const block of blocks) {
    const t = block.type;

    if (t === 'paragraph') {
      mdx.push(richTextToInline(block.paragraph.rich_text) || '<br />');
    }

    else if (t === 'heading_1' || t === 'heading_2' || t === 'heading_3') {
      const level = t === 'heading_1' ? '#' : t === 'heading_2' ? '##' : '###';
      mdx.push(`${level} ${richTextToInline(block[t].rich_text)}`);
    }

    else if (t === 'bulleted_list_item' || t === 'numbered_list_item') {
      const bullet = t === 'numbered_list_item' ? '1.' : '-';
      const txt = richTextToInline(block[t].rich_text);
      mdx.push(`${bullet} ${txt}`);
    }

    else if (t === 'quote' || t === 'callout') {
      const txt = richTextToInline(block[t].rich_text);
      mdx.push(`> ${txt}`);
    }

    else if (t === 'code') {
      const lang = block.code.language || '';
      const codeText = (block.code.rich_text ?? []).map((r: any) => r?.plain_text ?? '').join('');
      mdx.push('');
      mdx.push('```' + lang);
      mdx.push(codeText);
      mdx.push('```');
      mdx.push('');
    }

    else if (t === 'image') {
      const file = block.image?.external?.url ?? block.image?.file?.url;
      if (file) {
        const dl = await materializeImage(pageId, file, ++imageCount);
        const caption = richTextToInline(block.image.caption ?? []);
        mdx.push(`![${caption}](${dl.localRelPath})`);
      }
    }

    else if (t === 'divider') {
      mdx.push('---');
    }
  }

  const normalized = mdx.join('\n').replace(/\n{3,}/g, '\n\n');
  return { mdx: normalized, coverPath: localCover };
}
