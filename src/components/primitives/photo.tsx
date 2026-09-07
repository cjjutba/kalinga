import Image from "next/image";
import { cn } from "@/lib/utils";

// A photograph, or the space one will occupy. With a src it renders the real
// image through next/image, sized by the layout and cropped to fill. Without
// one it stays the quiet mid grey block it always was, so a spot can be laid
// out before the picture exists.
//
// The grey is darker than --field because white lockups and captions sit over
// it, and a real portrait is closer to that luminance than to a light surface.
// DESIGN.md says where photographs appear and where they never do.

export function Photo({
  className,
  caption = "Photo",
  src,
  alt,
  priority,
  sizes = "100vw",
  children,
}: {
  className?: string;
  caption?: string;
  /** A file under /public. Without it the placeholder is drawn instead. */
  src?: string;
  /** What the photograph shows. Required with a src, empty when decorative. */
  alt?: string;
  priority?: boolean;
  sizes?: string;
  children?: React.ReactNode;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-photo", className)}>
        <Image src={src} alt={alt ?? ""} fill sizes={sizes} priority={priority} className="object-cover" />
        {children}
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden bg-photo", className)} role="img" aria-label={`${caption} placeholder`}>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-label text-white/90">{caption}</span>
      </div>
      {children}
    </div>
  );
}
