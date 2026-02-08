<table width="100%">
  <tr>
    <td align="left" width="120">
      <img src="apps/web/public/logos/opencut/1k/logo-white-black.png" alt="OpenCut Logo" width="100" />
    </td>
    <td align="right">
      <h1>OpenCut</span></h1>
      <h3 style="margin-top: -10px;">A free, open-source video editor for web, desktop, and mobile.</h3>
    </td>
  </tr>
</table>

## Why?

- **Privacy**: Your videos stay on your device
- **Free features**: Most basic CapCut features are now paywalled 
- **Simple**: People want editors that are easy to use - CapCut proved that

## Features

- Timeline-based editing
- Multi-track support
- Real-time preview
- No watermarks or subscriptions
- Analytics provided by [Databuddy](https://www.databuddy.cc?utm_source=opencut), 100% Anonymized & Non-invasive.
- Blog powered by [Marble](https://marblecms.com?utm_source=opencut), Headless CMS.

## Project Structure

- `apps/web/` – Main Next.js web application
- `src/components/` – UI and editor components
- `src/hooks/` – Custom React hooks
- `src/lib/` – Utility and API logic
- `src/stores/` – State management (Zustand, etc.)
- `src/types/` – TypeScript types

## Getting Started

### Prerequisites

- Node.js 18+ 
- Bun (recommended) or npm
- PostgreSQL database
- Redis (for rate limiting)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/opencut.git
cd opencut
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Set up the database:
```bash
cd apps/web
bun run db:push:local
```

5. Start the development server:
```bash
bun run dev
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

Required environment variables for production:
- `NEXT_PUBLIC_SITE_URL` - Your deployed app URL
- `NEXT_PUBLIC_MARBLE_API_URL` - Marble API endpoint
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret for authentication
- `UPSTASH_REDIS_REST_URL` - Redis URL for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `MARBLE_WORKSPACE_KEY` - Marble workspace key
- `FREESOUND_CLIENT_ID` - FreeSound API client ID
- `FREESOUND_API_KEY` - FreeSound API key
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `R2_ACCESS_KEY_ID` - Cloudflare R2 access key
- `R2_SECRET_ACCESS_KEY` - Cloudflare R2 secret key
- `R2_BUCKET_NAME` - Cloudflare R2 bucket name
- `MODAL_TRANSCRIPTION_URL` - Modal transcription service URL

## Architecture

The editor uses a **singleton EditorCore** that manages all editor state through specialized managers:

```
EditorCore (singleton)
├── playback: PlaybackManager
├── timeline: TimelineManager
├── scene: SceneManager
├── project: ProjectManager
├── media: MediaManager
└── renderer: RendererManager
```

### Usage in React Components

Always use the `useEditor()` hook:

```typescript
import { useEditor } from '@/hooks/use-editor';

function MyComponent() {
  const editor = useEditor();
  const tracks = editor.timeline.getTracks();
  
  editor.timeline.addTrack({ type: 'media' });
  
  return <div>{tracks.length} tracks</div>;
}
```

### Actions System

Actions are the trigger layer for user-initiated operations. Use `invokeAction()` for user-triggered operations:

```typescript
import { invokeAction } from '@/lib/actions';

const handleSplit = () => invokeAction("split-selected");
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License


## License

MIT
