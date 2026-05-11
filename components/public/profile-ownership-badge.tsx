import { ProfileOwnershipStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export function ProfileOwnershipBadge({
  ownershipStatus
}: {
  ownershipStatus: ProfileOwnershipStatus;
}) {
  if (ownershipStatus === ProfileOwnershipStatus.claimed) {
    return null;
  }

  if (ownershipStatus === ProfileOwnershipStatus.claim_pending) {
    return <Badge tone="warning">Claim under review</Badge>;
  }

  return <Badge tone="warning">Unclaimed</Badge>;
}
