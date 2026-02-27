import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const blogTemplatePath = resolve(root, 'blog/index.html');
const postsIndexPath = resolve(root, 'public/posts/index.json');

const template = await readFile(blogTemplatePath, 'utf8');
const posts = JSON.parse(await readFile(postsIndexPath, 'utf8'));

if (!Array.isArray(posts)) {
  throw new Error('public/posts/index.json debe ser un array');
}

const SLUG_RE = /^[A-Za-z0-9-_]+$/;

for (const post of posts) {
  if (!post?.slug) continue;
  if (!SLUG_RE.test(post.slug)) {
    console.warn(`Skipping post with invalid slug: ${JSON.stringify(post.slug)}`);
    continue;
  }
  const dir = resolve(root, 'blog', post.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, 'index.html'), template, 'utf8');
}

console.log(`Generated ${posts.length} blog route(s).`);
