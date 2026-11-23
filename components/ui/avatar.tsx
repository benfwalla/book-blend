import Image from "next/image";
import { cn } from "@/lib/utils";
import { highResolutionGoodreadsImage } from "@/lib/goodreads-images";

const DEFAULT_AVATAR = "https://s.gr-assets.com/assets/nophoto/user/u_200x266-e183445fd1a1b5cc7075bb1cf7043306.png";

export function Avatar({ src, alt, className, size = 32 }: { src?: string | null; alt: string; className?: string; size?: number }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-full bg-gray-200 ring-2 ring-[#DBD4C1]", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={highResolutionGoodreadsImage(src) || DEFAULT_AVATAR}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </div>
  );
}
