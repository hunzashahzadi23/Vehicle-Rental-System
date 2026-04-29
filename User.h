#ifndef USER_H
#define USER_H

#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <cctype>
#include <conio.h>
#include <cstdlib>

#include "Car.h"
#include "Bike.h"
#include "Truck.h"

using namespace std;

enum class AccountStatus { Active, Suspended, Flagged };

/* 
 * [PILLAR: ABSTRACTION] 
 * Base class for all actors in the system (Admin, Customer).
 * It defines the high-level interface for user interactions.
 */
class User
{
protected:
    /* [PILLAR: ENCAPSULATION] 
     * Sensitive data is protected or private. Access is only allowed 
     * through public getters and setters to maintain data integrity.
     */
    string userID;
    string userName;
    string userEmail;
    string userPassword;
    string userPhoneNumber;
    string userAddress;
    string userType;
    string userCNIC;
    AccountStatus status;
    vector<string> actionLog;
    static int usersCount;
    
    vector<string> favoriteVehicles;

public:
    void addFavorite(const string& vehicleID);
    void removeFavorite(const string& vehicleID);
    vector<string> getFavorites() const;

    /* Constructors */
    User();
    User(const string &name, const string &email, const string &pass, const string &phoneNum, const string &address, const string &type, const string &cnic = "");

    /* Abstraction: Pure Virtual Functions */
    virtual void registerUser(vector <User*> &users);
    virtual void userConsole(vector <Vehicle*> &inventory) = 0;
    virtual void generateUserID() = 0;
    virtual void incrementOrDecrementIDCounter(bool isIncrement) = 0;
    virtual void editDetails() = 0;

    /* Encapsulation: Logic and Mutators */
    virtual void updateUserProfile(const string &name, const string &email, const string &pass, const string &phoneNum, const string &address);
    bool verifyLogin(const string &e, const string &p);
    virtual void displayUserInfo() const;
    
    // Status Management
    void setStatus(AccountStatus s) { status = s; }
    AccountStatus getStatus() const { return status; }
    string getStatusString() const;
    void logAction(const string& msg);

    /* Setters */
    void setUserID(const string &id);
    void setUserName(const string &name);
    void setUserEmail(const string &email);
    void setUserPassword(const string &password);
    void setUserPhoneNumber(const string &phoneNumber);
    void setUserAddress(const string &address);
    void setUserType(const string &type);
    void setUserCNIC(const string &cnic);

    /* Getters */
    string getUserID() const;
    string getUserName() const;
    string getUserEmail() const;
    string getUserPassword() const;
    string getUserPhoneNumber() const;
    string getUserAddress() const;
    string getUserType() const;
    string getUserCNIC() const;
    static int getUsersCount();

    /* Polymorphism: Operator Overloading */
    bool operator==(const User& other) const { return this->userID == other.userID; }
    friend ostream& operator<<(ostream& os, const User& u);

    /* Destructor */
    virtual ~User();
};

#endif