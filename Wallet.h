#ifndef WALLET_H
#define WALLET_H

#include <iostream>
#include <string>
#include <sstream>
#include <iomanip>
using namespace std;

/**
 * Wallet — Handles all financial logic for a Customer.
 * Composed inside Customer (not inherited).
 *
 * availableBalance : Funds the user can freely use.
 * lockedBalance    : Funds held in escrow during an active booking.
 *                    Released by Admin after successful return, or
 *                    penalized if a dispute is ruled against the renter.
 */
class Wallet
{
    double availableBalance;  // Free-to-use balance
    double lockedBalance;     // Escrow / held funds

public:
    /* Constructors */
    Wallet();
    Wallet(double available, double locked);

    /* Core Escrow Operations */

    /**
     * deposit() — Add funds to the available balance (top-up).
     * @param amount Must be positive.
     */
    void deposit(double amount);

    /**
     * lock() — Move funds from available → locked (escrow hold).
     * Called at booking creation.
     * @return false if insufficient available balance.
     */
    bool lock(double amount);

    /**
     * release() — Move funds from locked → available (escrow release).
     * Called by Admin after successful return clearance.
     */
    void release(double amount);

    /**
     * deduct() — Remove funds directly from locked balance (penalty).
     * Called by Admin when dispute is ruled against renter.
     */
    void deduct(double amount);

    /**
     * pay() — Deduct from available balance directly (e.g., insurance surcharge).
     * @return false if insufficient balance.
     */
    bool pay(double amount);

    /* Getters */
    double getAvailableBalance() const;
    double getLockedBalance() const;
    double getTotalBalance() const;

    /* Utility */
    string toDisplayString() const;
};

#endif
