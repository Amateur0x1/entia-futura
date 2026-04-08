# astro-cloudflared

Astro starter project with Cloudflare Workers support and local `cloudflared` tunnel scripts.

## Commands

All commands run from the project root:

```sh
npm install
npm run dev
npm run tunnel
```

### Local development

- `npm run dev`: Start Astro dev server on `http://localhost:4321`
- `npm run tunnel`: Expose the Astro dev server through `cloudflared`

### Cloudflare Workers

- `npm run cf:dev`: Build the app and preview it with `wrangler dev`
- `npm run tunnel:cf`: Expose the local Worker preview through `cloudflared`
- `npm run cf:deploy`: Build and deploy to Cloudflare Workers

## Getting started

1. `cd /Users/zhourongchang/project_cs/projects/astro-cloudflared`
2. `npm run dev`
3. In another terminal, run `npm run tunnel` if you want a public URL

## Notes

- `wrangler.jsonc` is configured for an Astro on-demand Worker build.
- `cloudflared` is expected to be installed on your machine and is already available in this environment.
