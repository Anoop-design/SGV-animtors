# SVG Animator

A visual SVG animation tool for creating and exporting animated icons.

Use the hosted tool at [Tenicons SVG Animator](https://www.tenicons.com/svg-animator).
The [Tenicons website](https://www.tenicons.com/) is maintained separately.

## Projects

- `icon-motion/` — the Next.js SVG Animator application, with animation presets and React, Framer Motion, CSS, and SVG exports.
- `path-animator/` — the earlier Vite-based path animation project.

## Run the animator locally

```sh
cd icon-motion
npm ci
npm run dev
```

Open http://localhost:3000. To build and serve a production build, run `npm run build` followed by `npm start` in the same directory. Hosting configuration for the `/svg-animator` subpath is managed separately from this repository's default local setup.

## License

The original source in this repository is available under the [MIT License](LICENSE). Third-party dependencies retain their own licenses and notices.
