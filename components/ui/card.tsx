import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  id
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cn("ac-card p-6", className)} id={id}>
      {children}
    </section>
  );
}
