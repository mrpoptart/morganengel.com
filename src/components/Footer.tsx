export function Footer() {
  return (
    <footer className="border-t border-base-content/5 mt-24 py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-sm text-base-content/30 font-mono">
          &copy; {new Date().getFullYear()} morgan.engel
        </span>
      </div>
    </footer>
  );
}
