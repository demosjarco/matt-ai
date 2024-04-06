# matt-ai

## Get Started

### Visit live

1. Go to [matt-ai.pages.dev](https://matt-ai.pages.dev)

### Run local

> [!TIP]
> This repo supports [GitHub Codespaces](https://github.com/features/codespaces) and is preconfigured for it.

> [!IMPORTANT]  
> Make sure you are running this project with the latest `lts` version of NodeJS (GitHub Codespaces is already setup with `lts/*`). Other versions may work but are not guaranteed.

1. Duplicate [`pages/.dev.vars.example`](pages/.dev.vars.example), but without the `.example` ending and fill in the valueS with appropriate values

> [!NOTE]  
> On `locahost` turnstile is configured for the [dummy](https://developers.cloudflare.com/turnstile/reference/testing/#dummy-sitekeys-and-secret-keys) `Always passes`/`invisible` keys. Use the `Always passes` secret key to allow usage.

2. Install packages: `npm ci --include-workspace-root --workspaces` (If you are running in GitHub Codespaces, you can skip this step)
3. Build everything: `npm run build:local` (If you are running in GitHub Codespaces, you can simply do `ctrl`/`cmd` + `shift` + `b`)
    - If there's ever a build error or corruption, a handy `npm run clean` is available
4. To run the site, there are 2 commands (1 for the frontend, 1 for the backend). I personally prefer to have 2 terminals for this.
    - Frontend: `npm -w pages start` (If you are running in GitHub Codespaces, the port is already forwarded and you should get a notification)
    - Backend: `npm -w worker start`

> [!NOTE]  
> If you are not logged into `wrangler` already, you will get a login link in terminal window once the first message is submitted. Follow it and sign in.

> [!WARNING]  
> Using Workers AI always accesses your Cloudflare account in order to run AI models, and so will incur usage charges even in local development.

## CI/CD

### Dependabot

#### Automated

Dependabot[bot] will automatically create and merge PRs for the following:

-   [x] `typescript-types` group
-   [x] `code-management` group
