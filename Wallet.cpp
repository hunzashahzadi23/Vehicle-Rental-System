#include "Wallet.h"
#include "Exceptions.h"
#include <sstream>
#include <iomanip>
using namespace std;

/* ── Constructors ─────────────────────────────────────────────────── */
Wallet::Wallet() : availableBalance(1000.0), lockedBalance(0.0) {}

Wallet::Wallet(double available, double locked)
    : availableBalance(available), lockedBalance(locked) {}

/* ── Core Escrow Operations ──────────────────────────────────────── */

void Wallet::deposit(double amount)
{
    if (amount > 0)
        availableBalance += amount;
}

bool Wallet::lock(double amount)
{
    // Cannot lock more than what is available
    if (amount > availableBalance)
        throw InsufficientFundsException("Cannot lock $" + to_string(amount) + ". Only $" + to_string(availableBalance) + " available.");
    
    availableBalance -= amount;
    lockedBalance    += amount;
    return true;
}

void Wallet::release(double amount)
{
    // Release escrow back to available (Admin clears return)
    double actual = (amount > lockedBalance) ? lockedBalance : amount;
    lockedBalance    -= actual;
    availableBalance += actual;
}

void Wallet::deduct(double amount)
{
    // Penalize from locked (Admin rules against renter in dispute)
    double actual = (amount > lockedBalance) ? lockedBalance : amount;
    lockedBalance -= actual;
}

bool Wallet::pay(double amount)
{
    if (amount > availableBalance)
        throw InsufficientFundsException("Insufficient balance for payment.");
    availableBalance -= amount;
    return true;
}

/* ── Getters ─────────────────────────────────────────────────────── */

double Wallet::getAvailableBalance() const { return availableBalance; }
double Wallet::getLockedBalance()    const { return lockedBalance; }
double Wallet::getTotalBalance()     const { return availableBalance + lockedBalance; }

/* ── Utility ─────────────────────────────────────────────────────── */

string Wallet::toDisplayString() const
{
    ostringstream oss;
    oss << fixed << setprecision(2);
    oss << "Available: $" << availableBalance
        << " | Locked (Escrow): $" << lockedBalance
        << " | Total: $" << (availableBalance + lockedBalance);
    return oss.str();
}
