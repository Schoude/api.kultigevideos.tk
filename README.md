# api.kultigevideos.tk

## Setup

1. Install [Deno](https://deno.land/)
2. For automatic server reload like nodemon for node install [denon](https://deno.land/x/denon@2.4.9) globally

## Development

### IDE setup for Deno support

If you use VS Code, install the official Deno extension. Then run the command `Deno: Initialize Workspace Configuration`.

You should also disable any other Typescript checks like Volar for Vue.

### Starting the server

1. With denon: `denon start` (auto reload on file save)

2. Through the standard deno command: `deno run --allow-net --allow-read --allow-env --unstable app.ts`

## Endpoints

| TYPE | METHOD | ENDPOINT                  | NEEDS AUTH? |
| ---- | ------ | ------------------------- | ----------- |
| Auth |        |                           |             |
|      | POST   | `/api/v1/user`            | [x]         |
|      | POST   | `/api/v1/login`           | [ ]         |
|      | POST   | `/api/v1/logout`          | [x]         |
|      | POST   | `/api/v1/refresh`         | [ ]         |
|      | POST   | `/api/v1/password-change` | [x]         |
| User | POST   | `/api/v1/user`            | [ ]         |
