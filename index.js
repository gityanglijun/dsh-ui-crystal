/**
 * Host loader entry for the browser-only Crystal theme plugin.
 * Provides no host-side behavior — the loader only needs a valid module to
 * construct the entry fiber, after which client-modules scans the package's
 * dsh.client declaration and serves its "./client" bundle to the browser.
 */
export function apply() {}
