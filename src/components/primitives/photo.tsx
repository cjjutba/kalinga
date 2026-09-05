import { cn } from "@/lib/utils";

// Where a photograph will go. A quiet mid grey block sized by the layout, so
// the real image can be dropped in later without moving anything. It is grey
// rather than --field because white lockups and captions sit over it, and a
// real portrait is closer to this luminance than to a light surface.
// DESIGN.md says where photographs appear and where they never do; this is the
// only component allowed to occupy those spots for now.

export function Photo({
  className,
  caption = "Photo",
  children,
}: {
  className?: string;
  caption?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-photo", className)} role="img" aria-label={`${caption} placeholder`}>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-label text-white/90">{caption}</span>
      </div>
      {children}
    </div>
  );
}
