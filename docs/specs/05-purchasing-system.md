1. Project Overview
   MisanClub is a digital ecosystem combining an e-commerce shop, essential services (energy, insurance, etc.), and a personal development academy into a single platform. The goal is to centralize all operations at www.misanclub.com, providing a unified member panel, a shared wallet, and an automated commission engine.
2. Platform Architecture & Integration Strategy
   The platform must consolidate four distinct types of offerings with different technical origins:

2.1 Web Integration (MDS - Método Delgada con Salud)
Status: Existing external web.
Action: Must be fully absorbed/integrated into the MisanClub domain.
Type: Proprietary product with high-value content (nutrition plans, training).

2.2 External Services (MisanClub Servicios & Viajes)
Origin: Commercial agreements with external providers (Energy, Alarms, Insurance, Travel).
Logic: Integration is based on margin sharing rather than web absorption.
MisanClub receives a commercial margin from the provider per contract.
70/30 Split: 70% of that margin goes to the socio; 30% funds the compensation plan (multilevel and pool).

2.3 MisanClub Shop & Elixsia Cosmetics
Origin: Physical products from internal inventory or direct providers.
Pricing: Dual price system (Member Price vs. Public Price).

2.4 MisanClub Academy
Origin: Proprietary educational content.
Logic: Integrated directly into the member panel.

3. Commission Engine & Business Rules
   The system must apply specific multipliers based on the product/service category:

| Categoría                            | Tipo de Plan   | N1   | N2   | N3  | N4   | N5   | Pool Contribution |
| :----------------------------------- | :------------- | :--- | :--- | :-- | :--- | :--- | :---------------- |
| **Standard** (Shop, Elixsia)         | Base           | 5%   | 3%   | 2%  | 1%   | 1%   | 5%                |
| **Proprietary** (MDS, Academy)       | Amplified (2x) | 10%  | 6%   | 4%  | 2%   | 2%   | 10%               |
| **Reduced** (Books, Specific brands) | 50% Reduction  | 2.5% | 1.5% | 1%  | 0.5% | 0.5% | 2.5%              |
| **Memberships**                      | Fixed Base     | 5%   | 3%   | 2%  | 1%   | 1%   | 5%                |

3.1 Services/Travel Special Rule
Calculated over the Commercial Margin (the 30% portion reserved for the club), not the total sale price.

4. Functional Modules

4.1 Invoicing & Memberships
Recurring Payments: Memberships must be processed as an annual recurring payment.
Autoinvoicing: The system must automatically generate an "autofactura" for every single purchase and membership renewal.

4.2 Unified Wallet & KYC
Wallet: A central ledger for all earnings (commissions, direct margins, pool shares).
KYC (Mandatory): Identity verification (DNI/NIE and Bank Certificate) is required before any withdrawal is authorized.
Withdrawal Rules: Minimum threshold (e.g., 50€) and defined processing windows.

4.3 Direct Margin Logic
If a sale is made via a socio's personal link to a non-member, the system calculates: Public Price - Member Price = Direct Margin for Socio.
Network commissions are then calculated on the Member Price excluding taxes.

5. Leadership Pool & Ranks
   Quarterly Calculation: The pool accumulates 5% of memberships and a variable % from sales (matching N1 rate).
   Rank-Based Shares: Repayment is distributed via "parts" assigned to ranks (Pioneer = 1, Ambassador = 20).
   Eligibility: Requires a minimum number of direct active socios and a quarterly volume of organization turnover.

6. Technical Constraints
   Base for Calculation: Always the Member Price without taxes (unless specified as Margin-based for services).
   Active Status: Only "Active Members" (current on annual fee) can generate or collect commissions.
   Referral Tracking: All transactions must be linked to a unique personal referral link for multilevel attribution.
