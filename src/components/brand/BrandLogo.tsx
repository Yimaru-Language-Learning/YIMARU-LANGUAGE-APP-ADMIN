import logoSrc from "../../assets/logo.svg";

export function BrandLogo({
  className = "h-10",
  variant = "dark",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  return (
    <img
      src={logoSrc}
      alt="Yimaru Academy"
      className={`${className} ${variant === "dark" ? "brightness-0" : ""}`}
    />
  );
}
