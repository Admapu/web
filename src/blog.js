import { marked } from 'marked';

const postContainer = document.getElementById('blog-post');
const postTitle = document.getElementById('blog-post-title');
const postMeta = document.getElementById('blog-post-meta');
const postList = document.getElementById('blog-post-list');

function getSlugFromUrl() {
  const path = window.location.pathname.replace(/\/+$/, '');
  const parts = path.split('/').filter(Boolean);
  // /blog/<slug>
  if (parts.length >= 2 && parts[0] === 'blog') return parts[1];

  // backward compatibility: /blog/?post=<slug>
  const url = new URL(window.location.href);
  return url.searchParams.get('post');
}

function renderList(posts, activeSlug) {
  postList.innerHTML = posts
    .map((post) => {
      const active = post.slug === activeSlug ? 'active' : '';
      return `
        <a class="post-link ${active}" href="/blog/${encodeURIComponent(post.slug)}">
          <strong>${post.title}</strong>
          <span>${post.date ?? ''}</span>
        </a>
      `;
    })
    .join('');
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

function renderPreviewList(postsWithContent) {
  postTitle.textContent = 'Posts recientes';
  postMeta.textContent = 'Resumen del contenido. Haz click en “Leer post completo” para abrir cada entrada.';

  postContainer.innerHTML = postsWithContent
    .map(({ post, excerpt }) => `
      <article class="post-preview">
        <h3>${post.title}</h3>
        <p class="muted small">${post.date ?? ''}</p>
        <p>${excerpt}</p>
        <a class="read-more" href="/blog/${encodeURIComponent(post.slug)}">Leer post completo →</a>
      </article>
    `)
    .join('');
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
    const posts = await loadPostsIndex();
    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error('No hay posts configurados en /posts/index.json');
    }

    const requestedSlug = getSlugFromUrl();
    const selected = posts.find((p) => p.slug === requestedSlug);

    renderList(posts, selected?.slug ?? null);

    // Index: solo previews (no post completo)
    if (!selected) {
      const postsWithContent = await Promise.all(
        posts.map(async (post) => {
          const markdown = await loadPostMarkdown(post.slug);
          return {
            post,
            excerpt: post.summary || toExcerpt(markdown),
          };
        })
      );

      renderPreviewList(postsWithContent);
      return;
    }

    // Post route: contenido completo
    const markdown = await loadPostMarkdown(selected.slug);
    postTitle.textContent = selected.title;
    postMeta.textContent = [selected.date, selected.summary].filter(Boolean).join(' · ');
    postContainer.innerHTML = marked.parse(markdown);
  } catch (err) {
    postTitle.textContent = 'Error al cargar el blog';
    postMeta.textContent = '';
    postContainer.innerHTML = `
      <p class="error">No se pudo cargar el contenido.</p>
      <pre>${err instanceof Error ? err.message : 'Error desconocido'}</pre>
    `;
  }
}

loadBlog();
