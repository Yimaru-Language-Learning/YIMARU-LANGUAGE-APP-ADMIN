import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

type PageBackLinkProps = {
  fallbackTo: string;
  label?: string;
  className?: string;
  iconClassName?: string;
};

export function PageBackLink({
  fallbackTo,
  label = "Back",
  className,
  iconClassName,
}: PageBackLinkProps) {
  return (
    <Link
      to={fallbackTo}
      className={cn(
        "group flex w-fit items-center gap-2 text-[15px] font-medium text-grayScale-600 transition-colors hover:text-brand-500",
        className,
      )}
    >
      <ArrowLeft
        className={cn(
          "h-4 w-4 transition-transform group-hover:-translate-x-0.5",
          iconClassName,
        )}
      />
      {label}
    </Link>
  );
}
