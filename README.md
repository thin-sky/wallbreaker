# Wallbreaker

Wallbreaker is a headless e-commerce store template built for non-profits and activist groups. It leverages [Fourthwall](https://fourthwall.com/), Cloudflare Workers, and Astro to provide a high-performance, cost-effective (free-tier friendly) online presence.

## 🚀 Quick Start

1.  **Clone the repo**
2.  **Install dependencies**: `npm install`
3.  **Configure Fourthwall**: Set up your webhooks to point to your deployment.
4.  **Deploy**: Changes pushed to `main` branch automatically deploy. For manual deployment, use `npm run deploy`.

## 📖 Documentation for Humans

- **Architecture Overview**: How the system is built and why. See `ai/architecture.md`.
- **Common Tasks**: Step-by-step guides for adding pages, handlers, and components. See `ai/tasks.md`.
- **Testing**: How to run and write tests. See `ai/testing.md`.
- **Deployment**: Workflow for deploying to Cloudflare. See `ai/deployment.md`.
- **Free Tier Management**: Staying within Cloudflare's free limits. See `ai/limitations.md`.

## 🛠 Tech Stack

- **Frontend**: Astro 5.x (Static & SSR)
- **API**: Hono on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Validation**: Zod
- **Components**: Custom Elements (Web Components)
- **Styling**: Modern CSS (No frameworks)

## 🤝 Contributing

We welcome contributions that keep the project simple and maintainable.
- **Simplicity First**: Changes should be easy for non-technical users to understand.
- **AI Friendly**: The repo is optimized for AI agents. See the `ai/` folder for agent-specific instructions.
- **Validation**: Always use Zod for database and API boundaries.

## 📄 License

MIT
