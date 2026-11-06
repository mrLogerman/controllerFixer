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

Copy `.env.example` and fill in the values you use. The repair form needs
`RESEND_API_KEY`. The admin page needs the Sanity values below.

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

## Admin page

Open `/admin` directly. There is no link to it on the site. Sign-in checks
`ADMIN_PASSWORD` on the server and keeps you in with an HTTP-only cookie. The
password is not stored in the repository, and sign-in stays closed until that
variable is set.

Feedback is one form: a quote, a name, and photos. It is not tied to a joystick
type, and published entries replace the sample quotes in the feedback carousel.
Video links stay on Traditional, Hall Effect, and TMR, and show on the matching
card. A joystick with no video keeps its “Video coming soon” block. Photos added
under “Controllers we’ve brought back” replace the gallery placeholders.

### Connecting Sanity

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage) and copy
   its project ID into `NEXT_PUBLIC_SANITY_PROJECT_ID`.
2. Create an API token with Editor permissions and put it in `SANITY_API_TOKEN`.
   This token is only read on the server.
3. In the Sanity project, add the document types from `sanity/schemaTypes`
   (`testimonial` and `joystickVideo`) so the studio shows the same fields the
   site writes. The site can save content through the API either way.
4. Redeploy after setting the variables. `NEXT_PUBLIC_SANITY_PROJECT_ID` is
   baked in at build time.

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
