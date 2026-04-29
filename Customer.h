#ifndef CUSTOMER_H
#define CUSTOMER_H

#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <cctype>
#include <conio.h>
#include <cstdlib>

#include "Booking.h"
#include "User.h"
#include "Wallet.h"
using namespace std;

/**
 * Customer — The Renter role in the Karwan marketplace.
 * Extended with: TrustScore (reputation) and Wallet (escrow).
 */
class Customer : public User 
{
    vector <Booking> bookings;
    double trustScore;
    Wallet wallet;
    int loyaltyPoints;
    static int customersCount;
    static int customerIDCounter;
    static const int POINTS_PER_RENTAL = 10;

public:
    Customer();
    Customer(const string &name, const string &email, const string &pass, const string &phoneNum, const string &address, const string &cnic = "");

    static void setCustomerIDCounter(int count);
    static int getCustomersCount();
    const vector<Booking>& getBookings() const;
    void generateUserID() override;
    void incrementOrDecrementIDCounter(bool isIncrement) override;
    
    // Core Rental Logic
    void rentVehicle(vector <Vehicle*> &inventory);
    void returnVehicle(vector <Vehicle*> &inventory);
    void addBooking(Booking &b);
    
    // UI Methods
    void viewAllBookings() const ;
    void viewWallet() const;
    void topUpWallet();
    void userConsole(vector <Vehicle*> &inventory) override;
    void editDetails() override;

    // Loyalty System
    void addPoints(int p) { loyaltyPoints += p; }
    int getLoyaltyPoints() const { return loyaltyPoints; }

    /* Trust Score */
    void setTrustScore(double score);
    double getTrustScore() const;
    void penalizeTrust(double amount);

    /* Wallet Access */
    Wallet& getWallet();
    const Wallet& getWalletConst() const;

    /* Polymorphism: Operator Overloading */
    Customer& operator+=(int points) { loyaltyPoints += points; return *this; }

    /* Friend Class: Admin can see private logs for disputes */
    friend class Admin;

    ~Customer();
};

#endif