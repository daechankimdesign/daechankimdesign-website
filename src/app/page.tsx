export default function Home() {
  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-display">Daechan Kim</h1>
      <p className="text-body text-fg-muted">
        Product designer — portfolio in progress.
      </p>
      <a href="/styleguide" className="link text-body mt-2">
        View the design-system styleguide →
      </a>
    </main>
  );
}
