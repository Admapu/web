import { marked } from 'marked';

const postContainer = document.getElementById('blog-post');
const postTitle = document.getElementById('blog-post-title');
const postMeta = document.getElementById('blog-post-meta');
const postList = document.getElementById('blog-post-list');

function getSlugFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get('post');
}

function renderList(posts, activeSlug) {
  postList.innerHTML = posts
    .map((post) => {
      const active = post.slug === activeSlug ? 'active' : '';
      return `
        <a class="post-link ${active}" href="/blog/?post=${encodeURIComponent(post.slug)}">
          <strong>${post.title}</strong>
          <span>${post.date ?? ''}</span>
        </a>
      `;
    })
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
    const selected = posts.find((p) => p.slug === requestedSlug) ?? posts[0];

    renderList(posts, selected.slug);

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
