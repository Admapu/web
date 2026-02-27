import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function blogInputs() {
  const inputs = {
    main: resolve(__dirname, 'index.html'),
    blog: resolve(__dirname, 'blog/index.html'),
  };

  try {
    const posts = JSON.parse(readFileSync(resolve(__dirname, 'public/posts/index.json'), 'utf8'));
    if (Array.isArray(posts)) {
      for (const post of posts) {
        if (!post?.slug) continue;
        inputs[`blog-${post.slug}`] = resolve(__dirname, `blog/${post.slug}/index.html`);
      }
    }
  } catch {
    // ignore - build still works with base pages
  }

  return inputs;
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: blogInputs(),
    },
  },
});
