import { cn } from "cn";

import { Button } from "@/app/components/ui/button";

/**
 * What the Almena wallet scans: the QR code, the button that opens the wallet
 * on this device instead, and a line on the wait. Every QR of the portal is
 * drawn by this one.
 */
export function WalletQr({
  qr,
  deepLink,
  label,
  open,
  status,
  className,
}: {
  /** The SVG drawn server side from the API's link. */
  qr: string;
  deepLink: string;
  /** What the code is, for screen readers. */
  label: string;
  open: string;
  status: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3.5", className)}>
      <div
        className="qr mx-auto w-[220px] rounded-xl bg-qr-paper p-2.5"
        role="img"
        aria-label={label}
        dangerouslySetInnerHTML={{ __html: qr }}
      />
      <Button asChild size="lg" className="w-full">
        <a href={deepLink}>{open}</a>
      </Button>
      <p className="text-center text-sm text-muted-foreground" role="status">
        {status}
      </p>
    </div>
  );
}
