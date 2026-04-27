# JobTracker Pro Production Deployment Plan

Deploying this architecture requires coordinating three independent pieces of software (the Next.js Frontend, the Node.js Background Worker, and the Chrome Extension) and configuring third-party Cloud services like Firebase and Google Cloud for production domains. 

Since your local workspace relies on `.env` files that cannot be committed to Git, we need to inject them into the production servers.

## Proposed Strategy

### Phase 1: Firebase & Google Cloud Whitelisting
Before deploying the code, we must authorize your production domain (e.g., `jobtracker.vercel.app`) to use Firebase Auth and Google OAuth.
- Add the production domain to Firebase `Authentication > Settings > Authorized domains`.
- Add the production domain to your Google Cloud Console OAuth 2.0 Web Client credentials.

### Phase 2: Next.js Frontend (Vercel)
Vercel is the native host for Next.js and will handle the React rendering and API routes seamlessly.
- **Method:** We can push the codebase to a GitHub repository and link it to Vercel, OR I can install the `vercel` CLI locally on your machine and deploy it directly from your terminal.
- **Environment Bindings:** We will need to map `GEMINI_API_KEY`, `FIREBASE_*` keys, and the `UPSTASH_REDIS` connections into Vercel's environment settings.

### Phase 3: Background Worker (Render / Railway)
The `job-scraper-service` runs BullMQ and headless browser scraping. Vercel's serverless functions time out completely after 10 seconds, making it incompatible with long-running web scraping tasks.
- **Method:** We will deploy the `job-scraper-service` folder as a persistent Node.js Docker container/Web Service on platforms like Render.com or Railway.app.
- **Environment Bindings:** It will need the `UPSTASH_REDIS_URL` to receive messages from the Vercel app.

### Phase 4: Chrome Extension Publishing
- Adjust `background.js` inside the `job-clipper-extension` to point to the new production Vercel URL (e.g., changing `http://localhost:3000/api/clip` to `https://jobtracker.com/api/clip`).
- Package the extension into a `.zip` file.
- You can either load the `.zip` locally forever, or upload it to the Chrome Web Store Developer Dashboard for public distribution.

## Open Questions

> [!IMPORTANT]
> How would you like to proceed?
> 1. **Terminal Deployment (Fastest):** Do you want me to automatically install `npx vercel` and deploy the Next.js app straight from your terminal right now? (You will be prompted to log in to Vercel).
> 2. **GitHub Deployment (Best Practice):** Do you want to push this to your GitHub and manually link it via the Vercel dashboard? 

Let me know which route you prefer for Phase 2, and we'll execute it immediately!
