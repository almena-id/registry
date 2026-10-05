import { WalletRequest } from "@/app/components/WalletRequest";
import { Card } from "@/app/components/ui/card";
import type { SignTarget, WalletPurpose } from "@/app/lib/wallet-actions";
import { DetailHead } from "./[section]/[id]/Detail";

/**
 * A decision taken in the Almena wallet, on a screen of its own: where to go
 * back to, what is decided, and the QR card centred under them. Every such
 * screen of the dashboard is this one.
 */
export function WalletScreen({
  back,
  backLabel,
  title,
  lead,
  notice,
  purpose,
  target,
}: {
  back: string;
  backLabel: string;
  title: string;
  lead?: string;
  /** A warning above the card, as wide as it. */
  notice?: React.ReactNode;
  purpose: WalletPurpose;
  target?: SignTarget;
}) {
  return (
    <div className="grid gap-4">
      <DetailHead back={back} backLabel={backLabel} />
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight break-words">
          {title}
        </h1>
        {lead && <p className="text-muted-foreground">{lead}</p>}
      </header>
      <div className="grid w-full max-w-[400px] gap-4 justify-self-center">
        {notice}
        <Card className="gap-0 p-6">
          <WalletRequest purpose={purpose} target={target} />
        </Card>
      </div>
    </div>
  );
}
