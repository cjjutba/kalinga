// Stand in for the "server-only" package under vitest, which has no React
// server condition. In Next the real package throws when a server module is
// pulled into a client bundle.
export {};
