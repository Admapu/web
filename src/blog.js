import { marked } from 'marked';

const postContainer = document.getElementById('blog-post');

async function loadPost() {
  try {
    const res = await fetch('/posts/hola-mundo.md', { cache: 'no-store' });
    if (!res.ok) throw new Error(`No se pudo cargar markdown (${res.status})`);

    const markdown = await res.text();
    postContainer.innerHTML = marked.parse(markdown);
  } catch (err) {
    postContainer.innerHTML = `
      <p class="error">No se pudo cargar el post.</p>
      <pre>${err instanceof Error ? err.message : 'Error desconocido'}</pre>
    `;
  }
}

loadPost();
