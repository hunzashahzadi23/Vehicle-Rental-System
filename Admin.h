#ifndef ADMIN_H
#define ADMIN_H

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
#include "Customer.h"
using namespace std;

// Forward declare Lessor to avoid circular include
class Lessor;

class Admin : public User
{
    static int adminsCount;
    static int adminIDCounter;
    vector<Customer*>* customersCtx;  // Context pointer for dispute resolution

public:
    Admin();
    Admin(const string &name, const string &email, const string &pass, const string &phoneNum, const string &address, const string &cnic = "");

    static void setAdminIDCounter(int count);
    static int getAdminsCount();
    void generateUserID() override;
    void incrementOrDecrementIDCounter(bool isIncrement) override;
    void addVehicleToInventory(vector <Vehicle*> &inventory);
    void removeVehicleFromInventory(vector <Vehicle*> &inventory);
    void viewAllVehicles(const vector <Vehicle*> &inventory);
    
    /* NEW: Karwan Admin Powers */
    void verifyVehicleListings(vector <Vehicle*> &inventory);
    void disputeResolutionCenter(vector<Customer*> &customers);
    void setCustomersContext(vector<Customer*>* ctx);
    void viewUserActionLog(Customer* c);
    
    void userConsole(vector <Vehicle*> &inventory) override;
    void editDetails() override;

    ~Admin();
};

#endif