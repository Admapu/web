import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function blogTrailingSlashPlugin() {
  return {
    name: 'blog-trailing-slash',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '/';
        if ((url === '/blog' || /^\/blog\/[A-Za-z0-9-_]+$/.test(url)) && !url.endsWith('/')) {
          res.statusCode = 302;
          res.setHeader('Location', `${url}/`);
          res.end();
          return;
        }
        next();
      });
    },
  };
}

function blogInputs() {
  const inputs = {
    main: resolve(__dirname, 'index.html'),
    blog: resolve(__dirname, 'blog/index.html'),
  };

  try {
    const posts = JSON.parse(readFileSync(resolve(__dirname, 'public/posts/index.json'), 'utf8'));
    if (Array.isArray(posts)) {
      for (const post of posts) {
        if (!post?.slug || !/^[A-Za-z0-9-_]+$/.test(post.slug)) continue;
        inputs[`blog-${post.slug}`] = resolve(__dirname, `blog/${post.slug}/index.html`);
      }
    }
  } catch {
    // ignore - build still works with base pages
  }

  return inputs;
}

export default defineConfig({
  appType: 'mpa',
  plugins: [blogTrailingSlashPlugin()],
  build: {
    rollupOptions: {
      input: blogInputs(),
    },
  },
});
