/** Payphone clientTransactionId while checkout session is open (no order row yet). */
export const MARKETPLACE_CARD_CLIENT_TX_KEY =
  'marketplace_card_client_transaction_id';

export function setCardCheckoutInFlight(clientTransactionId: string): void {
  sessionStorage.setItem(MARKETPLACE_CARD_CLIENT_TX_KEY, clientTransactionId);
}

export function clearCardCheckoutInFlight(): void {
  sessionStorage.removeItem(MARKETPLACE_CARD_CLIENT_TX_KEY);
}

export function getCardCheckoutInFlight(): string | null {
  return sessionStorage.getItem(MARKETPLACE_CARD_CLIENT_TX_KEY);
}
