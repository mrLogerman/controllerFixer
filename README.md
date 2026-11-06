# Vancouver Controller Repair

A one-page controller repair site for Xbox and PS5 controllers, built with
Next.js, TypeScript, Tailwind CSS, shadcn/ui primitives, Motion, React Hook
Form, Zod, and Resend.

## Local development

```bash
npm install
npm run dev
```

## Environment variables

```bash
RESEND_API_KEY=your_resend_key          # required, sends the repair requests
NEXT_PUBLIC_SITE_URL=https://...        # optional, your live domain for SEO links
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...      # optional, shows the spam check widget
TURNSTILE_SECRET_KEY=...                # optional, verifies it server-side
```

## Spam protection

Create a Cloudflare Turnstile widget for your domain and paste its two keys
above. Use your real keys, not Cloudflare's demo keys — the demo keys render a
"For testing only. If seen, report to site owner" notice on the widget.

Without `NEXT_PUBLIC_TURNSTILE_SITE_KEY` the widget is not rendered at all, and
without `TURNSTILE_SECRET_KEY` the server skips verification. In both cases the
form still submits normally.

## Repair request emails

Requests are emailed to `techoleks@gmail.com` with the subject
"Controller fix request", sent from
`repairs@contact.vancouvercontrollerrepair.com`, and replies go straight back to
the customer. Both addresses live as `DEFAULT_RECIPIENT` and `DEFAULT_SENDER` at
the top of `app/api/repair-request/route.ts`; the sender domain has to stay
verified in Resend.

## Adding the joystick videos

Fill in `videoId` for each entry of the `joystickTypes` array in
`components/landing-page.tsx`. The ID is the part of the YouTube URL after
`v=` — for `https://www.youtube.com/watch?v=dQw4w9WgXcQ` that is
`dQw4w9WgXcQ`. Any card left blank shows a "Video coming soon" block.

## Adding your own photos

Drop images in `public/` and reference them from the code:

- Gallery of finished repairs: the `gallery` array in
  `components/landing-page.tsx`
- Customer feedback photos: the `image` field in `lib/testimonials.ts`
- Repair option videos: the two placeholders in the "Choose your fix" section of
  `components/landing-page.tsx`

## Deployment

On Vercel, import the repository and add the environment variables in the
project settings.

On Netlify, `netlify.toml` already sets the build command to `npm run build` and
the publish directory to `.next`; add the environment variables under Site
configuration → Environment variables. Keep the server build — a static export
would break the `/api/repair-request` route the form posts to. Note that
`NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing
them.
