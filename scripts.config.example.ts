// This is a file that describes how denon should run the dev server.
// Running the app with denon allows you to have watch mode for a better development experience.

import type { DenonConfig } from 'https://deno.land/x/denon@2.4.9/mod.ts';

const config: DenonConfig = {
  scripts: {
    start: {
      cmd: 'deno run app.ts',
      desc: 'Run my app.ts file',
      allow: ['net', 'read', 'env'],
      unstable: true,
    },
  },
};

export default config;
