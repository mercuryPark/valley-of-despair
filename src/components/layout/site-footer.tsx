export function SiteFooter() {
  return (
    <footer className="border-border text-muted-foreground border-t px-6 py-6 text-xs">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <span>© 2026 valleyofdespair</span>
        <a
          href="https://github.com/mercuryPark/valley-of-despair"
          className="hover:text-foreground transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
