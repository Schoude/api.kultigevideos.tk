import { ENVIRONMENT } from './base-types.ts';
import { Application, oakCors } from './deps.ts';

const app = new Application();

// CORS Setup
let corsConfig = {};

if (Deno.env.get('APP_ENV') === ENVIRONMENT.PROD) {
  corsConfig = {
    origin: [
      'https://kultigevideos.tk',
      'https://cms.kultigevideos.tk',
      'http://localhost:3000',
    ],
    credentials: true,
  };
} else {
  corsConfig = {
    origin: ['http://localhost:4000', 'http://localhost:5000'],
    credentials: true,
  };
}

app.use(oakCors(corsConfig));

app.use(c => {
  c.response.body = 'TEST';
});

app.addEventListener(
  'listen',
  ({
    hostname,
    port,
    secure,
  }: {
    hostname: string;
    port: number;
    secure: boolean;
  }) => {
    console.log(
      `### Listening on: ${secure ? 'https://' : 'http://'}${
        hostname ?? '127.0.0.1'
      }:${port}`
    );
  }
);

await app.listen({ port: 4000 });
