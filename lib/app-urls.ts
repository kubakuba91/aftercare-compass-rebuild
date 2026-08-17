const localAppOrigin = "http://localhost:3000";

function normalizeOrigin(value: string | undefined, fallback: string) {
  const candidate = value?.trim() || fallback;

  try {
    return new URL(candidate).origin;
  } catch {
    return fallback;
  }
}

function withPath(origin: string, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

export function publicAppOrigin() {
  return normalizeOrigin(
    process.env.NEXT_PUBLIC_PUBLIC_APP_URL,
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL, localAppOrigin)
  );
}

export function dashboardAppOrigin() {
  return normalizeOrigin(process.env.NEXT_PUBLIC_DASHBOARD_APP_URL, publicAppOrigin());
}

export function publicAppUrl(path = "/") {
  return withPath(publicAppOrigin(), path);
}

export function dashboardAppUrl(path = "/") {
  return withPath(dashboardAppOrigin(), path);
}

export function configuredAppHosts() {
  return {
    publicHost: new URL(publicAppOrigin()).host,
    dashboardHost: new URL(dashboardAppOrigin()).host
  };
}

export function hasSeparateDashboardOrigin() {
  const { publicHost, dashboardHost } = configuredAppHosts();
  return publicHost !== dashboardHost;
}
