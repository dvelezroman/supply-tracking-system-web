export type PayphoneBoxConfig = {
  token: string;
  storeId: string;
  clientTransactionId: string;
  amount: number;
  amountWithTax: number;
  amountWithoutTax: number;
  tax: number;
  service: number;
  tip: number;
  currency: string;
  reference: string;
  lang: string;
  defaultMethod: 'card';
  timeZone: number;
  lat?: string;
  lng?: string;
  email?: string;
  phoneNumber?: string;
  optionalParameter?: string;
};

export type PayphoneButtonBoxOptions = PayphoneBoxConfig & {
  backgroundColor?: string;
};

export type PPaymentButtonBoxInstance = {
  render: (elementId: string) => unknown;
};

export type PPaymentButtonBoxConstructor = new (
  options: PayphoneButtonBoxOptions,
) => PPaymentButtonBoxInstance;

declare global {
  interface Window {
    PPaymentButtonBox?: PPaymentButtonBoxConstructor;
  }
}

export {};
