import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Brand({
  href = "/",
  className,
  markClassName,
  textClassName,
  showMark = true,
}: {
  shopName?: string;
  href?: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showMark?: boolean;
}) {
  return (
    <Link href={href} className={cn("flex min-w-0 items-center gap-2.5", className)}>
      {showMark && (
        <span
          className={cn(
            "relative h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10",
            markClassName
          )}
        >
          <Image src="/HostelHub-logo.png" alt="HostelHub logo" fill sizes="36px" className="object-cover" />
        </span>
      )}
      <span className={cn("truncate text-lg font-extrabold tracking-tight", textClassName)}>
        <span className="text-lime-400">Hostel</span>
        <span className="text-white">Hub</span>
      </span>
    </Link>
  );
}
