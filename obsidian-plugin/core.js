/* Pure helpers shared by the plugin and its regression tests. */
function inFolder(path, folder) {
  const base = folder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  return path.startsWith(base + '/') && path.endsWith('.md');
}
function makeSlug(title, key) {
  return title.trim().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 140) || `note-${key.slice(0,8)}`;
}
function list(value) { return Array.isArray(value) ? value.map(String) : typeof value === 'string' ? [value] : []; }
function publication(frontmatter, body, basename, key, state) {
  const title = String(frontmatter.title || basename).trim();
  const date = frontmatter.date ? new Date(frontmatter.date) : new Date(state.date || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error('date 日期无效');
  return { operation: frontmatter.share === true ? 'publish' : 'unpublish', key,
    title, slug: String(frontmatter.slug || state.slug || makeSlug(title,key)),
    excerpt: String(frontmatter.excerpt || body.replace(/[#*`\[\]]/g,'').trim().slice(0,160) || title),
    tags: list(frontmatter.tags), categories: list(frontmatter.categories),
    date: date.toISOString(), raw: body, content: body };
}
function fingerprint(payload) {
  if (payload.operation === 'unpublish') return 'unpublish';
  return JSON.stringify([payload.title,payload.slug,payload.excerpt,payload.tags,payload.categories,payload.date,payload.raw,payload.content]);
}
async function replaceAsync(text, regex, convert) {
  const matches = [...text.matchAll(regex)]; let output=''; let offset=0;
  for (const match of matches) { output += text.slice(offset,match.index) + await convert(match); offset=match.index+match[0].length; }
  return output+text.slice(offset);
}
// Do not rewrite examples inside fenced or inline code blocks.
async function transformMarkdown(body, convert) {
  const parts=body.split(/(^[ \t]*`{3,}[^\n]*\n[\s\S]*?^[ \t]*`{3,}[^\n]*(?:\n|$)|^[ \t]*~{3,}[^\n]*\n[\s\S]*?^[ \t]*~{3,}[^\n]*(?:\n|$)|`+[^`\n]*`+)/gm);
  for(let i=0;i<parts.length;i+=2) parts[i]=await convert(parts[i]);
  return parts.join('');
}
module.exports={inFolder,makeSlug,publication,fingerprint,replaceAsync,transformMarkdown};
