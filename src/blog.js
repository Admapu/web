import { marked } from 'marked';
import DOMPurify from 'dompurify';

const postContainer = document.getElementById('blog-post');
const postTitle = document.getElementById('blog-post-title');
const postMeta = document.getElementById('blog-post-meta');
const postList = document.getElementById('blog-post-list');

function getSlugFromUrl() {
  const path = window.location.pathname.replace(/\/+$/, '');
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'blog') return parts[1];

  const url = new URL(window.location.href);
  return url.searchParams.get('post');
}

function sortPostsNewestFirst(posts) {
  return [...posts].sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());
}

function renderList(posts, activeSlug) {
  postList.replaceChildren(
    ...posts.map((post) => {
      const a = document.createElement('a');
      a.className = `post-link${post.slug === activeSlug ? ' active' : ''}`;
      a.href = `/blog/${encodeURIComponent(post.slug)}`;
      a.textContent = `${post.date ?? ''} - ${post.title}`;
      return a;
    })
  );
}

function toExcerpt(markdown, max = 240) {
  const noCode = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^\)]*\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/[>*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (noCode.length <= max) return noCode;
  return `${noCode.slice(0, max).trimEnd()}…`;
}

function renderIndex(posts) {
  postTitle.textContent = '';
  postMeta.textContent = '';
  postContainer.replaceChildren();
  renderList(posts, null);
}

async function loadPostsIndex() {
  const res = await fetch('/posts/index.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`No se pudo cargar index de posts (${res.status})`);
  return res.json();
}

async function loadPostMarkdown(slug) {
  const res = await fetch(`/posts/${slug}.md`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`No se pudo cargar post ${slug} (${res.status})`);
  return res.text();
}

async function loadBlog() {
  try {
    const posts = sortPostsNewestFirst(await loadPostsIndex());
    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error('No hay posts configurados en /posts/index.json');
    }

    const requestedSlug = getSlugFromUrl();
    const selected = posts.find((p) => p.slug === requestedSlug);

    renderList(posts, selected?.slug ?? null);

    if (!selected) {
      renderIndex(posts);
      return;
    }

    let markdown = await loadPostMarkdown(selected.slug);
    postTitle.textContent = selected.title;
    postMeta.textContent = [selected.date, selected.summary].filter(Boolean).join(' · ');

    const escapedTitle = selected.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const h1Re = new RegExp(`^#\\s+${escapedTitle}\\s*\\n+`, 'i');
    markdown = markdown.replace(h1Re, '');

    const backLink = '<p><a href="/blog/">← Volver</a></p>';
    postContainer.innerHTML = DOMPurify.sanitize(`${backLink}${marked.parse(markdown)}`);
  } catch (err) {
    postTitle.textContent = 'Error al cargar el blog';
    postMeta.textContent = '';

    const p = document.createElement('p');
    p.className = 'error';
    p.textContent = 'No se pudo cargar el contenido.';

    const pre = document.createElement('pre');
    pre.textContent = err instanceof Error ? err.message : 'Error desconocido';

    postContainer.replaceChildren(p, pre);
  }
}

loadBlog();
