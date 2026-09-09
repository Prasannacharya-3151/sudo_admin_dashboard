import type { RechargeMachine, MachineBalance } from "../types/machine";

// ==========================================
// GET MACHINE BALANCE (SINGLE SOURCE OF TRUTH)
//
// The API's list/detail response returns the
// current balance as `recharge_balance`, as a
// STRING. Older fields (`balance`,
// `initial_balance`) are kept as fallbacks in
// case a particular endpoint returns those
// instead.
// ==========================================

export const getMachineBalanceValue = (
  machine: RechargeMachine,
  balanceData?: MachineBalance | null,
): number => {
  if (balanceData?.balance !== undefined && balanceData?.balance !== null) {
    return Number(balanceData.balance);
  }

  if (
    machine.recharge_balance !== undefined &&
    machine.recharge_balance !== null
  ) {
    return Number(machine.recharge_balance);
  }

  if (machine.balance !== undefined && machine.balance !== null) {
    return Number(machine.balance);
  }

  if (
    machine.initial_balance !== undefined &&
    machine.initial_balance !== null
  ) {
    return Number(machine.initial_balance);
  }

  return 0;
};