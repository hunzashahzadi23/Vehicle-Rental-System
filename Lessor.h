#ifndef LESSOR_H
#define LESSOR_H

#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <cctype>
#include <conio.h>
#include <cstdlib>

#include "User.h"
#include "Booking.h"
using namespace std;

/**
 * Lessor — The Vehicle Owner role in the Karwan marketplace.
 * Inherits from User (abstract base).
 *
 * Lessors can:
 *  - Post vehicles to the marketplace (triggers VerificationEngine check)
 *  - View their current listings and rental status
 *  - Report vehicle damage (opens a dispute on a booking)
 *  - Track their earnings
 *
 * ID format: UL-XXXX
 */
class Lessor : public User
{
    double rating;                      // Average rating (1.0 – 5.0), starts at 5.0
    double earnings;                    // Total accumulated earnings (PKR/USD)
    vector<string> vehiclePostIDs;      // IDs of vehicles this Lessor has posted

    static int lessorsCount;
    static int lessorIDCounter;

public:
    /* Constructors */
    Lessor();
    Lessor(const string &name, const string &email, const string &pass,
           const string &phoneNum, const string &address, const string &cnic);

    /* ID management */
    static void setLessorIDCounter(int count);
    static int getLessorsCount();
    void generateUserID() override;
    void incrementOrDecrementIDCounter(bool isIncrement) override;

    /* Vehicle Post management */
    void addVehiclePostID(const string &id);
    const vector<string>& getVehiclePostIDs() const;

    /* Business actions */
    void postVehicle(vector<Vehicle*> &inventory);
    void viewMyListings(const vector<Vehicle*> &inventory) const;
    void reportDamage(vector<Booking> &bookings);

    /* Console entry point */
    void userConsole(vector<Vehicle*> &inventory) override;
    void editDetails() override;

    /* Setters */
    void setRating(double r);
    void setEarnings(double e);
    void addEarnings(double amount);

    /* Getters */
    double getRating() const;
    double getEarnings() const;

    /* Destructor */
    ~Lessor();
};

#endif
