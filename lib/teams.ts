export const TEAMS = [
  { id: 'customer-support', name: 'Customer Support' },
  { id: 'fraud-and-security', name: 'Fraud and Security' },
  { id: 'disputes-chargebacks', name: 'Disputes/Chargebacks' },
  { id: 'loan-servicing', name: 'Loan Servicing' },
] as const;

export type TeamId = (typeof TEAMS)[number]['id'];
