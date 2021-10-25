import { ENVIRONMENT } from './base-types.ts';
import { Application, Context, oakCors, Router, Status } from './deps.ts';
import { authRouter } from './src/routers/auth.ts';
import { userRouter } from './src/routers/user.ts';

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
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
  };
}

app.use(oakCors(corsConfig));

const router = new Router();

router.get('/api/v1/check', (c: Context) => {
  c.response.status = Status.OK;
  c.response.body = 'This is the API for kultigevideos.tk.';
});

app.use(router.routes());
app.use(router.allowedMethods());

app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

app.use(userRouter.routes());
app.use(userRouter.allowedMethods());

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
