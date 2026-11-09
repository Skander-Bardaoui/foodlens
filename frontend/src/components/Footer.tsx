const footerLinks = [
  { label: "Privacy", href: "#" },
  { label: "API Docs", href: "/api/docs" },
  { label: "Feedback", href: "#" },
];

export default function Footer() {
  return (
    <footer className="mb-16 w-full bg-surface-lowest py-8 shadow-footer md:mb-0">
      <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-4 px-4 font-body text-body-sm text-muted md:flex-row md:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="font-body text-label-md font-semibold text-ink">FoodLens AI</span>
          <span aria-hidden="true">•</span>
          <span>© 2025 FoodLens AI • Built with FastAPI + React</span>
        </div>
        <div className="flex items-center gap-6 font-body text-label-md">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-brand"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
