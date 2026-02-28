import { marked } from 'marked';
import DOMPurify from 'dompurify';

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
  postList.replaceChildren(
    ...posts.map((post) => {
      const a = document.createElement('a');
      a.className = `post-link${post.slug === activeSlug ? ' active' : ''}`;
      a.href = `/blog/${encodeURIComponent(post.slug)}`;

      const strong = document.createElement('strong');
      strong.textContent = post.title;
      const span = document.createElement('span');
      span.textContent = post.date ?? '';

      a.append(strong, span);
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

function renderPreviewList(postsWithContent) {
  postTitle.textContent = 'Posts recientes';
  postMeta.textContent = 'Resumen del contenido. Haz click en “Leer post completo” para abrir cada entrada.';

  postContainer.replaceChildren(
    ...postsWithContent.map(({ post, excerpt }) => {
      const article = document.createElement('article');
      article.className = 'post-preview';

      const h3 = document.createElement('h3');
      h3.textContent = post.title;

      const datePara = document.createElement('p');
      datePara.className = 'muted small';
      datePara.textContent = post.date ?? '';

      const excerptPara = document.createElement('p');
      excerptPara.textContent = excerpt;

      const link = document.createElement('a');
      link.className = 'read-more';
      link.href = `/blog/${encodeURIComponent(post.slug)}`;
      link.textContent = 'Leer post completo →';

      article.append(h3, datePara, excerptPara, link);
      return article;
    })
  );
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
    postContainer.innerHTML = DOMPurify.sanitize(marked.parse(markdown));
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
