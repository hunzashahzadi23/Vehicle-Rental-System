#ifndef FINTECHENGINE_H
#define FINTECHENGINE_H

#include <iostream>
#include <string>
using namespace std;

/**
 * FintechEngine — Manages all pricing and escrow deposit logic.
 *
 * Tiered Insurance Matrix:
 * ┌─────────────────┬──────────────────────────────────────────────────┐
 * │ Vehicle + Tier  │ Security Deposit                                 │
 * ├─────────────────┼──────────────────────────────────────────────────┤
 * │ Normal + Basic  │ 20% of total rental cost                         │
 * │ Normal + Premium│ $0 deposit (fully covered)                       │
 * │ Luxury + Basic  │ 40% of total rental cost                         │
 * │ Luxury + Premium│ $50 flat "Good Behavior" deposit                 │
 * └─────────────────┴──────────────────────────────────────────────────┘
 *
 * Premium insurance adds a 15% surcharge on top of the base rental.
 *
 * All methods are static — no instantiation needed.
 */
class FintechEngine
{
public:
    /**
     * calculateDeposit() — Returns the escrow deposit amount.
     * @param isLuxury       true = Luxury vehicle, false = Normal
     * @param insuranceTier  "Basic" or "Premium"
     * @param totalRentalCost Base rental cost (rate × days)
     * @return deposit amount in dollars
     */
    static double calculateDeposit(bool isLuxury, const string &insuranceTier,
                                   double totalRentalCost);

    /**
     * calculateInsuranceSurcharge() — Returns the extra insurance cost.
     * @param baseCost       Base rental cost (rate × days)
     * @param insuranceTier  "Basic" (free) or "Premium" (+15%)
     * @return surcharge amount
     */
    static double calculateInsuranceSurcharge(double baseCost,
                                              const string &insuranceTier);

    /**
     * calculateTotalCost() — Base cost + insurance surcharge.
     */
    static double calculateTotalCost(double ratePerDay, int days,
                                     const string &insuranceTier);

    /**
     * displayPriceBreakdown() — Print a formatted price summary to console.
     */
    static void displayPriceBreakdown(double ratePerDay, int days,
                                      bool isLuxury, const string &insuranceTier);
};

#endif
