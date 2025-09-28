import Link from "next/link";
import InfoButtonModal from "./InfoButtonModal";

export default function Header() {
  return (
    <header className="mb-6 sm:mb-8 lg:mb-10 flex items-start justify-between">
      <div>
        <Link href="/" className="inline-block">
          <img 
            src="/img/logo-horizontal.svg" 
            alt="BookBlend" 
            className="h-12 w-auto mb-2"
          />
        </Link>
        <p className="text-sm text-gray-600">Like Spotify Blend, but for books.</p>
      </div>
      <InfoButtonModal />
    </header>
  );
}
