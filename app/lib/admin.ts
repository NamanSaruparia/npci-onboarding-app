export function hasAdminAccess(req: Request): boolean {
  // Open by default for now; if ADMIN_ACCESS_KEY is set, require header match.
  const configuredKey = process.env.ADMIN_ACCESS_KEY;
  if (!configuredKey) return true;

  const suppliedKey = req.headers.get("x-admin-key");
  return suppliedKey === configuredKey;
}

export function adminUnauthorizedResponse() {
  return Response.json(
    { message: "Admin access denied." },
    { status: 401 }
  );
}
