module.exports = {
  apps: [
    {
      name: "api.kultigevideos",
      script: "./app.ts",
      interpreter: "deno",
      interpreterArgs: "run --allow-net --allow-read --allow-env --unstable",
    },
  ],
};
