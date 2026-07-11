import { useMemo, type ReactNode } from "react";
import { AbilityProvider as CaslAbilityProvider } from "@casl/react";
import { defineAbilityFor } from "@/lib/ability";
import { useAppSelector } from "@/store/hooks";

export function AbilityProvider({ children }: { children: ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);

  const ability = useMemo(
    () => defineAbilityFor(user?.role ?? "viewer"),
    [user?.role],
  );

  return (
    <CaslAbilityProvider value={ability}>{children}</CaslAbilityProvider>
  );
}
