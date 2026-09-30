# AstraMind

AstraMind is a full-stack AI workspace with authentication, chat, document upload and chat, web search, email generation, YouTube summarization, bookmarks, image generation, gallery management, and Razorpay subscriptions.

## Project Structure

```text
AstraMind/
├── Backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controller/
│   │   │   ├── agent.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── chat.controller.js
│   │   │   ├── document.controller.js
│   │   │   ├── image.controller.js
│   │   │   └── payment.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── checkUsage.js
│   │   ├── model/
│   │   │   ├── bookmark.model.js
│   │   │   ├── chat.model.js
│   │   │   ├── document.model.js
│   │   │   ├── message.model.js
│   │   │   ├── subscription.model.js
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   ├── agent.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── chat.routes.js
│   │   │   ├── document.routes.js
│   │   │   ├── image.routes.js
│   │   │   └── payment.routes.js
│   │   ├── services/
│   │   │   ├── ai.service.js
│   │   │   ├── aiRouter.service.js
│   │   │   ├── document.service.js
│   │   │   ├── image.service.js
│   │   │   ├── internet.service.js
│   │   │   ├── mail.service.js
│   │   │   └── models/
│   │   │       ├── groq.service.js
│   │   │       └── mistral.service.js
│   │   ├── sockets/
│   │   │   └── server.socket.js
│   │   └── validator/
│   │       └── auth.validator.js
│   └── uploads/
│
└── Frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── src/
    │   ├── main.jsx
    │   ├── app/
    │   │   ├── App.jsx
    │   │   ├── app.routes.jsx
    │   │   ├── app.store.js
    │   │   └── index.css
    │   ├── config/
    │   │   └── api.js
    │   └── features/
    │       ├── auth/
    │       │   ├── auth.slice.js
    │       │   ├── component/Protected.jsx
    │       │   ├── hooks/useAuth.js
    │       │   ├── pages/Login.jsx
    │       │   ├── pages/Register.jsx
    │       │   ├── services/auth.api.js
    │       │   └── style/Login.css
    │       ├── bookmarks/
    │       │   ├── components/BookmarkList.jsx
    │       │   ├── hooks/useBookmarks.js
    │       │   ├── pages/Bookmarks.jsx
    │       │   └── service/bookmark.api.js
    │       ├── chat/
    │       │   ├── chat.slice.js
    │       │   ├── component/ChatInputBar.jsx
    │       │   ├── component/Sidebar.jsx
    │       │   ├── hooks/useChats.js
    │       │   ├── hooks/useMessageHandling.js
    │       │   ├── pages/Dashboard.jsx
    │       │   ├── service/chat.api.js
    │       │   ├── service/chat.socket.js
    │       │   └── style/Home.css
    │       ├── gallery/
    │       │   ├── hooks/useGallery.js
    │       │   ├── pages/Gallery.jsx
    │       │   └── service/gallery.api.js
    │       └── payment/
    │           ├── pages/Pricing.jsx
    │           ├── service/razorpay.service.js
    │           └── style/Pricing.css
    └── public/
```

## Requirements

- Node.js 18 or newer
- MongoDB connection string
- A Vercel project for the frontend
- A Render Web Service for the backend
- API credentials for the features you enable

## Local Setup

Install dependencies:

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

Create `Backend/.env` with the backend variables listed below. Create `Frontend/.env` with:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

Start the backend:

```bash
cd Backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd Frontend
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend runs on `http://localhost:3000` by default.

## Vercel Frontend Deployment

Create a Vercel project from this repository with these settings:

- Root Directory: `Frontend`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Add these Vercel environment variables:

```env
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com
VITE_SOCKET_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Use the Render backend URL without a trailing slash and without `/api`. Vite variables are injected at build time, so redeploy the frontend after changing them.

## Render Backend Deployment

Create a Render Web Service from this repository with these settings:

- Root Directory: `Backend`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

Render supplies `PORT` automatically. The server listens on that port and on `0.0.0.0`.

Add these Render environment variables:

```env
NODE_ENV=production
FRONTEND_URL=https://YOUR-VERCEL-APP.vercel.app
BACKEND_URL=https://YOUR-RENDER-SERVICE.onrender.com
MONGO_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_long_random_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_USER=your_google_email
NVIDIA_API_KEY=your_nvidia_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
TAVILY_API_KEY=your_tavily_api_key
YOUTUBE_API_KEY=your_youtube_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

`PORT` is managed by Render. Do not hardcode it in Render environment variables unless you have a specific reason.

Only add credentials for integrations used by your deployment. Never commit real secret values. The backend and frontend `.gitignore` files exclude `.env`.

## Environment Variable Roles

- `VITE_API_URL`: Backend origin used by frontend HTTP requests.
- `VITE_SOCKET_URL`: Backend origin used by Socket.IO. It can match `VITE_API_URL`.
- `FRONTEND_URL`: Exact deployed frontend origin allowed by backend CORS and Socket.IO.
- `BACKEND_URL`: Public backend origin used in verification emails.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET_KEY`: Secret used to sign authentication tokens.
- `GOOGLE_*`: Gmail OAuth credentials used by the mail service.
- `NVIDIA_API_KEY`: NVIDIA model API credential.
- `HUGGINGFACE_API_KEY`: Document embedding credential.
- `TAVILY_API_KEY`: Internet search credential.
- `YOUTUBE_API_KEY`: YouTube metadata API credential.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: Razorpay payment credentials.

## Deployment Order

1. Deploy the Backend to Render.
2. Copy the Render service URL into `VITE_API_URL`, `VITE_SOCKET_URL`, and `BACKEND_URL` as appropriate.
3. Deploy the Frontend to Vercel.
4. Copy the Vercel URL into Render's `FRONTEND_URL`.
5. Redeploy the backend after setting the final Vercel URL.
6. Redeploy the frontend after setting the final Render URL.

The production authentication cookie is configured for cross-site Vercel-to-Render requests. Both services must use HTTPS in production.

## Validation Commands

Frontend build:

```bash
cd Frontend
npm run build
```

Frontend lint:

```bash
cd Frontend
npm run lint
```

Backend source syntax check in PowerShell:

```powershell
Get-ChildItem Backend -Recurse -File -Include *.js |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\uploads\\' } |
  ForEach-Object { node --check $_.FullName }
```

## API Areas

- `/api/auth`: registration, login, email verification, session, and logout
- `/api/chats`: chat messages, chat history, agent messages, and deletion
- `/api/ai`: image generation and gallery data
- `/api/documents`: document upload, document chat, listing, and deletion
- `/api/agent`: web search, email, YouTube, bookmarks, and jobs
- `/api/payment`: Razorpay order, payment verification, and subscription status
- Socket.IO: real-time chat streaming through the backend origin

## Important Notes

- Configure the exact frontend origin in `FRONTEND_URL`; do not use `*` when credentials are enabled.
- Do not add `/api` to `VITE_API_URL`; frontend services append their own API paths.
- Render's filesystem is ephemeral. Uploaded files stored in `Backend/uploads` should not be treated as permanent storage.
- Keep all production credentials in Vercel and Render environment settings, not in source files.
