#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <iomanip>
#include <cctype>
#include <conio.h>
#include <cstdlib>

#include "User.h"
using namespace std;

User::User() : userID(""), userName(""), userEmail(""), userPassword(""), userPhoneNumber(""), userAddress(""), userType(""), userCNIC(""), status(AccountStatus::Active)
{
    usersCount++;
}

User::User(const string &name, const string &email, const string &pass, const string &phoneNum, const string &address, const string &type, const string &cnic)
    : userID(""), userName(name), userEmail(email), userPassword(pass), userPhoneNumber(phoneNum), userAddress(address), userType(type), userCNIC(cnic), status(AccountStatus::Active)
{
    usersCount++;
}

void User::logAction(const string& msg) {
    actionLog.push_back(msg);
}

string User::getStatusString() const {
    switch (status) {
        case AccountStatus::Active: return "Active";
        case AccountStatus::Suspended: return "Suspended";
        case AccountStatus::Flagged: return "Flagged";
        default: return "Unknown";
    }
}

ostream& operator<<(ostream& os, const User& u) {
    os << "[" << u.userType << "] ID: " << u.userID << " | Name: " << u.userName << " | Status: " << u.getStatusString();
    return os;
}

void User::registerUser(vector <User*> &users)
{
    printFormattedText("Enter the full name of the user:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, userName);

    printLineWithSpaces();
    bool flag;
    do
    {
        flag = false;
        printFormattedText("Enter the email of the user:", COLOR_WHITE, false);
        printInputPrompt();
        getline(cin, userEmail);
        if (!isEmailValid(userEmail))
        {
            printFormattedText("Error: Invalid email! Try again.", COLOR_RED, false);
        }

        for (User *u : users)
        {
            if (u->getUserEmail() == userEmail)
            {
                printFormattedText("Error: The email address you entered is already associated with an existing account. Please use a different email.", COLOR_RED, false);
                flag = true;
                break;
            }
        }
    } while (!isEmailValid(userEmail) || flag);
    
    string repeatedPassword;
    printLineWithSpaces();
    do
    {
        do
        {
            printFormattedText("Enter the password of the user:", COLOR_WHITE, false);
            printInputPrompt();
            userPassword = maskedPassword();
            cout << endl;
            
            if (!isValidPassword(userPassword))
            {
                printFormattedText("Error: Password must be of atleast 7 characters.", COLOR_RED, false);
            }
        } while (!isValidPassword(userPassword));

        printFormattedText("Enter password again for confirmation:", COLOR_WHITE, false);
        printInputPrompt();
        repeatedPassword = maskedPassword();
        cout << endl;

        if (repeatedPassword != userPassword)
        {
            printFormattedText("Error: Passwords do not match. Try again!", COLOR_RED, false);
        }
    } while (repeatedPassword != userPassword);

    printLineWithSpaces();
    do {
        printFormattedText("Enter the phone number of the user:", COLOR_WHITE, false);
        printInputPrompt();
        getline(cin, userPhoneNumber);

        if (!isValidPhoneNumber(userPhoneNumber)) {
            printFormattedText("Error: Phone number must start with '03', be 12 characters long, and contain a '-' at the 5th position (e.g., 03XX-XXXXXXX).", COLOR_RED, false);
        }
    } while (!isValidPhoneNumber(userPhoneNumber));

    printLineWithSpaces();
    printFormattedText("Enter the address of the user:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, userAddress);

    /* ── NEW: CNIC Input ──────────────────────────────────────────── */
    printLineWithSpaces();
    printFormattedText("Enter your CNIC (e.g., 12345-6789012-3):", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, userCNIC);
}

void User::updateUserProfile(const string &name, const string &email, const string &pass, const string &phoneNum, const string &address)
{
    this->userName = name;
    this->userEmail = email;
    this->userPassword = pass;
    this->userPhoneNumber = phoneNum;
    this->userAddress = address;
}

bool User::verifyLogin(const string &e, const string &p)
{
    return (userEmail == e && userPassword == p);
}

void User::displayUserInfo() const
{
    cout << "User ID: " << userID << endl;
    cout << "Name: " << userName << endl;
    cout << "Email: " << userEmail << endl;
    cout << "CNIC: " << userCNIC << endl;
    cout << "Phone Number: " << userPhoneNumber << endl;
    cout << "Address: " << userAddress << endl;
}

/* Setters */
void User::setUserID(const string &id) { userID = id; }
void User::setUserName(const string &name) { userName = name; }
void User::setUserEmail(const string &email) { userEmail = email; }
void User::setUserPassword(const string &password) { userPassword = password; }
void User::setUserPhoneNumber(const string &phoneNumber) { userPhoneNumber = phoneNumber; }
void User::setUserAddress(const string &address) { userAddress = address; }
void User::setUserType(const string &type) { userType = type; }
void User::setUserCNIC(const string &cnic) { userCNIC = cnic; }

/* Getters */
string User::getUserID() const { return userID; }
string User::getUserName() const { return userName; }
string User::getUserEmail() const { return userEmail; }
string User::getUserPassword() const { return userPassword; }
string User::getUserPhoneNumber() const { return userPhoneNumber; }
string User::getUserAddress() const { return userAddress; }
string User::getUserType() const { return userType; }
string User::getUserCNIC() const { return userCNIC; }
int User::getUsersCount() { return usersCount; }

User::~User() { usersCount--; }

int User::usersCount = 0;

void User::addFavorite(const string& vehicleID) {
    // Only add if it doesn't already exist
    if (find(favoriteVehicles.begin(), favoriteVehicles.end(), vehicleID) == favoriteVehicles.end()) {
        favoriteVehicles.push_back(vehicleID);
    }
}

void User::removeFavorite(const string& vehicleID) {
    favoriteVehicles.erase(remove(favoriteVehicles.begin(), favoriteVehicles.end(), vehicleID), favoriteVehicles.end());
}

vector<string> User::getFavorites() const {
    return favoriteVehicles;
}