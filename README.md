# Next.js Blog with Real-Time Likes

This is a blog application built with Next.js that includes real-time like updates using Server-Sent Events (SSE).

## Real-Time Likes Debugging

If you're experiencing issues with the real-time likes functionality, follow these steps to debug and test it:

### Testing with the Debug Page

1. Visit `/test-sse` in your browser to access the SSE debugging tool
2. Enter a post slug in the input field (e.g., "my-post")
3. Click "Connect" to establish an SSE connection
4. Click "Send Test Like" to simulate a like action
5. Watch the messages area to see the SSE events being received

The debug page shows:
- Connection status (connected, disconnected, error)
- All SSE messages received
- Results of like API calls

### Common Issues & Solutions

#### Connection Problems
- **Issue**: SSE connection fails or disconnects frequently
- **Solution**: Check your Next.js configuration, especially headers. Ensure proper CORS and Cache-Control settings.

#### No Real-Time Updates
- **Issue**: Likes update for the user who clicked but not for others
- **Solution**: Verify that the broadcastUpdate function in the SSE route is being called with the correct slug.

#### Inconsistent Like State
- **Issue**: Like status doesn't match actual database state
- **Solution**: Check the GET endpoint for posts to ensure it's correctly determining isLiked status.

### Troubleshooting Checklist

1. Verify SSE connection is established (check network tab in browser dev tools)
2. Confirm like API is sending POST requests successfully
3. Check server logs for broadcast messages
4. Ensure client components are listening for SSE events
5. Verify data format in broadcasts matches what components expect

## Implementation Details

The real-time likes system uses these key components:

1. **SSE Server** (`src/app/api/sse/route.js`): Maintains connections and broadcasts updates
2. **Like API** (`src/app/api/posts/like/route.js`): Handles like/unlike actions and triggers broadcasts
3. **PostActions Component** (`src/components/postActions/PostActions.jsx`): Displays likes and listens for updates
4. **Single Post API** (`src/app/api/posts/[slug]/route.js`): Provides post data including like status

## Debugging Tip

Enable debug mode in the components by setting `DEBUG = true` at the top of each file to see detailed logs in the browser console.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
