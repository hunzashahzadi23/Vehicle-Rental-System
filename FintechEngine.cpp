#include "FintechEngine.h"
#include "Common.h"
#include <iostream>
#include <iomanip>
#include <sstream>
using namespace std;

/* ── Deposit Calculation ─────────────────────────────────────────── */

double FintechEngine::calculateDeposit(bool isLuxury, const string &insuranceTier,
                                       double totalRentalCost)
{
    if (!isLuxury && insuranceTier == "Basic")
    {
        // Normal + Basic : 20% of rental cost held in escrow
        return totalRentalCost * 0.20;
    }
    else if (!isLuxury && insuranceTier == "Premium")
    {
        // Normal + Premium : Zero deposit — fully insured
        return 0.0;
    }
    else if (isLuxury && insuranceTier == "Basic")
    {
        // Luxury + Basic : 40% of rental cost (higher risk)
        return totalRentalCost * 0.40;
    }
    else // Luxury + Premium
    {
        // Luxury + Premium : $50 flat "Good Behavior" deposit
        return 50.0;
    }
}

/* ── Insurance Surcharge ─────────────────────────────────────────── */

double FintechEngine::calculateInsuranceSurcharge(double baseCost,
                                                  const string &insuranceTier)
{
    if (insuranceTier == "Premium")
        return baseCost * 0.15;  // +15% for Premium coverage
    return 0.0;                  // Basic is included at no extra charge
}

/* ── Total Cost ──────────────────────────────────────────────────── */

double FintechEngine::calculateTotalCost(double ratePerDay, int days,
                                         const string &insuranceTier)
{
    double base = ratePerDay * days;
    return base + calculateInsuranceSurcharge(base, insuranceTier);
}

/* ── Price Breakdown (Console) ───────────────────────────────────── */

void FintechEngine::displayPriceBreakdown(double ratePerDay, int days,
                                          bool isLuxury, const string &insuranceTier)
{
    double base       = ratePerDay * days;
    double surcharge  = calculateInsuranceSurcharge(base, insuranceTier);
    double total      = base + surcharge;
    double deposit    = calculateDeposit(isLuxury, insuranceTier, total);

    printLineWithDashes();
    printFormattedText("=== PRICE BREAKDOWN ===", COLOR_CYAN, true);
    printFormattedText("Base Rental  : $" + toTwoDecimalString(ratePerDay) +
                       " x " + to_string(days) + " days = $" + toTwoDecimalString(base),
                       COLOR_WHITE, false);
    printFormattedText("Vehicle Tier : " + string(isLuxury ? "LUXURY" : "Normal"),
                       isLuxury ? COLOR_YELLOW : COLOR_WHITE, false);
    printFormattedText("Insurance    : " + insuranceTier +
                       " (+$" + toTwoDecimalString(surcharge) + ")",
                       COLOR_WHITE, false);
    printFormattedText("Total Rental : $" + toTwoDecimalString(total),
                       COLOR_GREEN, false);
    printFormattedText("Escrow Deposit (Locked): $" + toTwoDecimalString(deposit),
                       COLOR_YELLOW, false);
    printFormattedText("Total Charged Now: $" + toTwoDecimalString(total + deposit),
                       COLOR_CYAN, false);
    printLineWithDashes();
}
