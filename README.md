# Wallbreaker

Wallbreaker is a headless e-commerce store template built for non-profits and activist groups. It leverages [Fourthwall](https://fourthwall.com/), Cloudflare Workers, and Astro to provide a high-performance, cost-effective (free-tier friendly) online presence.

## 🚀 Quick Start

1.  **Clone the repo**
2.  **Install dependencies**: `npm install`
3.  **Configure Fourthwall**: Set up your webhooks to point to your deployment.
4.  **Deploy**: Changes pushed to `main` branch automatically deploy. For manual deployment, use `npm run deploy`.

## 📖 Documentation

- **Architecture Overview**: How the system is built and why. See `agents/architecture.md`.
- **Common Tasks**: Step-by-step guides for adding pages, handlers, and components. See `agents/tasks.md`.
- **Testing**: How to run and write tests. See `agents/testing.md`.
- **Deployment**: Workflow for deploying to Cloudflare. See `agents/deployment.md`.
- **Free Tier Management**: Staying within Cloudflare's free limits. See `agents/limitations.md`.

## 🛠 Tech Stack

- **Frontend**: Astro 6.x (Static & SSR)
- **Components**: HTML Custom Elements and Web Components
- **Styling**: Modern CSS (No frameworks)
- **API**: Hono on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Validation**: Zod

## 🤝 Contributing

We welcome contributions that keep the project simple and maintainable.
- **Simplicity First**: Changes should be easy for new developers to understand.
- **AI Friendly**: The repo is optimized for AI agents. See the `agents/` folder for agent-specific instructions.

## 📄 License

MIT
