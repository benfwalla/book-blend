import Image from "next/image";
import { cn } from "@/lib/utils";

export function Avatar({ src, alt, className, size = 32 }: { src?: string | null; alt: string; className?: string; size?: number }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-full bg-gray-200 ring-2 ring-[#DBD4C1]", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <Image
          src={"https://s.gr-assets.com/assets/nophoto/user/u_25x33-ccd24e68f4773d33a41ce08c3a34892e.png"}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      )}
    </div>
  );
}
