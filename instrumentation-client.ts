import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    // Autocapture, session recordings and heatmaps are toggled in the
    // PostHog project settings dashboard, not here.
  });
}

export function onRouterTransitionStart(url: string) {
  if (key) posthog.capture("$pageview", { $current_url: url });
}
