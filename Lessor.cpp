#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <cctype>
#include <conio.h>
#include <cstdlib>

#include "Lessor.h"
#include "Car.h"
#include "Bike.h"
#include "Truck.h"
#include "VerificationEngine.h"
#include "Common.h"
using namespace std;

Lessor::Lessor() : rating(5.0), earnings(0.0)
{
    lessorsCount++;
    lessorIDCounter++;
    generateUserID();
}

Lessor::Lessor(const string &name, const string &email, const string &pass,
               const string &phoneNum, const string &address, const string &cnic)
    : User(name, email, pass, phoneNum, address, "Lessor", cnic), rating(5.0), earnings(0.0)
{
    lessorsCount++;
    lessorIDCounter++;
    generateUserID();
}

void Lessor::setLessorIDCounter(int count) { lessorIDCounter = count; }
int Lessor::getLessorsCount() { return lessorsCount; }

void Lessor::generateUserID()
{
    stringstream ss;
    ss << "UL-" << setw(4) << setfill('0') << lessorIDCounter;
    userID = ss.str();
}

void Lessor::incrementOrDecrementIDCounter(bool isIncrement)
{
    (isIncrement) ? lessorIDCounter++ : lessorIDCounter--;
}

void Lessor::addVehiclePostID(const string &id) { vehiclePostIDs.push_back(id); }
const vector<string>& Lessor::getVehiclePostIDs() const { return vehiclePostIDs; }

void Lessor::setRating(double r) { rating = r; }
void Lessor::setEarnings(double e) { earnings = e; }
void Lessor::addEarnings(double amount) { earnings += amount; }
double Lessor::getRating() const { return rating; }
double Lessor::getEarnings() const { return earnings; }

void Lessor::postVehicle(vector<Vehicle*> &inventory)
{
    Vehicle *newVehicle;
    string options[3] = {"Car", "Bike", "Truck"};
    int choice = 0, maxChoices = 2;
    bool optionChosen = false;
    char pressedKey, confirmation;

    do
    {
        system("cls");
        printLineWithDashes();
        printFormattedText("Post A Vehicle To Marketplace", COLOR_BLUE, true);
        printLineWithDashes();
        printLineWithDashes();
        printFormattedText("Choose vehicle type:", COLOR_WHITE, false);
        for (int i = 0; i < 3; i++)
        {
            if(i == choice)
                printFormattedText(string("==> ") + to_string(i+1) + ". " + options[i], COLOR_YELLOW, false);
            else
                printFormattedText(to_string(i+1) + ". " + options[i], COLOR_WHITE, false);
        }
        printLineWithDashes();
        pressedKey = _getch();
        if ((pressedKey == 'w' || pressedKey == 'W' || pressedKey == 72) && choice > 0) choice--;
        else if ((pressedKey == 's' || pressedKey == 'S' || pressedKey == 80) && choice < maxChoices) choice++;
        else if (pressedKey == '\r')
        {
            switch (choice)
            {
            case 0: newVehicle = new Car(); optionChosen = true; break;
            case 1: newVehicle = new Bike(); optionChosen = true; break;
            case 2: newVehicle = new Truck(); optionChosen = true; break;
            }
        }
    } while (!optionChosen);

    newVehicle->addVehicle(inventory);

    /* Verification check against gov_registry.csv */
    bool verified = VerificationEngine::verify(newVehicle->getLicensePlate(), userCNIC);
    if (verified)
    {
        newVehicle->setVerificationStatus("Pending"); // Still needs Admin approval
        printFormattedText("Registry Match FOUND. Status set to PENDING (awaiting Admin approval).", COLOR_GREEN, false);
    }
    else
    {
        newVehicle->setVerificationStatus("Pending");
        printFormattedText("No registry match found. Status set to PENDING for manual review.", COLOR_YELLOW, false);
    }

    newVehicle->setOwnerID(userID);

    printFormattedText("Confirm posting this vehicle? (Y/N):", COLOR_WHITE, false);
    printInputPrompt();
    cin >> confirmation;
    cin.ignore();

    if (confirmation == 'y' || confirmation == 'Y')
    {
        inventory.push_back(newVehicle);
        vehiclePostIDs.push_back(newVehicle->getVehicleID());
        // Audit log removed (managed by frontend/firebase)
        printLineWithDashes();
        printFormattedText("Vehicle (" + newVehicle->getVehicleID() + ") posted!", COLOR_GREEN, true);
    }
    else
    {
        newVehicle->incrementOrDecrementIDCounter(false);
        delete newVehicle;
        printLineWithDashes();
        printFormattedText("Discarding.", COLOR_RED, true);
    }
    printLineWithDashes();
    system("pause");
}

void Lessor::viewMyListings(const vector<Vehicle*> &inventory) const
{
    system("cls");
    printLineWithDashes();
    printFormattedText("My Vehicle Listings", COLOR_BLUE, true);
    printLineWithDashes();
    printLineWithDashes();
    bool found = false;
    for (const auto &v : inventory)
    {
        if (v->getOwnerID() == userID)
        {
            cout << *v;
            found = true;
        }
    }
    if (!found) printFormattedText("You have no vehicles posted yet.", COLOR_WHITE, true);
    printFormattedText("Total Earnings: $" + toTwoDecimalString(earnings), COLOR_GREEN, false);
    printFormattedText("Owner Rating: " + toTwoDecimalString(rating) + "/5.0", COLOR_YELLOW, false);
    printLineWithDashes();
    system("pause");
}

void Lessor::reportDamage(vector<Booking> &bookings)
{
    system("cls");
    printLineWithDashes();
    printFormattedText("Report Vehicle Damage", COLOR_BLUE, true);
    printLineWithDashes();
    string bookingID;
    printFormattedText("Enter Booking ID to dispute:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, bookingID);
    for (auto &b : bookings)
    {
        if (lowercaseString(b.getBookingID()) == lowercaseString(bookingID) && b.getOwnerID() == userID)
        {
            b.setStatus(Booking::STATUS_DISPUTED);
            // Audit log removed
            printFormattedText("Booking " + bookingID + " marked as DISPUTED. Admin will review.", COLOR_YELLOW, true);
            printLineWithDashes();
            system("pause");
            return;
        }
    }
    printFormattedText("Booking not found or not owned by you.", COLOR_RED, true);
    printLineWithDashes();
    system("pause");
}

void Lessor::editDetails()
{
    string newName, newEmail, newPass, newPhone, newAddress;
    system("cls");
    printLineWithDashes();
    printFormattedText("Editing Owner Details", COLOR_BLUE, true);
    printLineWithDashes();
    printLineWithDashes();
    printFormattedText("Current Username: " + userName, COLOR_WHITE, false);
    printFormattedText("Enter new username:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, newName);
    printFormattedText("Current Email: " + userEmail, COLOR_WHITE, false);
    printFormattedText("Enter new email:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, newEmail);
    while (!isEmailValid(newEmail))
    {
        printFormattedText("Invalid email! Try again:", COLOR_WHITE, false);
        printInputPrompt();
        getline(cin, newEmail);
    }
    printFormattedText("Enter new password:", COLOR_WHITE, false);
    printInputPrompt();
    newPass = maskedPassword();
    cout << endl;
    printFormattedText("Enter new phone:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, newPhone);
    printFormattedText("Enter new address:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, newAddress);
    char confirmation;
    printFormattedText("Save changes? (Y/N):", COLOR_WHITE, false);
    printInputPrompt();
    cin >> confirmation;
    cin.ignore();
    if (confirmation == 'y' || confirmation == 'Y')
    {
        updateUserProfile(newName, newEmail, newPass, newPhone, newAddress);
        printFormattedText("Profile updated!", COLOR_GREEN, true);
    }
    else
        printFormattedText("Discarding.", COLOR_RED, true);
    printLineWithDashes();
    system("pause");
}

void Lessor::userConsole(vector<Vehicle*> &inventory)
{
    string options[5] = {
        "Edit Owner Details", "Post A Vehicle", "View My Listings",
        "Report Vehicle Damage", "Sign Out"
    };
    int choice = 0, maxChoices = 4;
    bool exitStatus = false;
    char pressedKey;
    do
    {
        system("cls");
        printLineWithDashes();
        printFormattedText("Vehicle Owner Console", COLOR_BLUE, true);
        printLineWithDashes();
        printFormattedText("Welcome, Owner " + userName + "!", COLOR_WHITE, true);
        printFormattedText("Rating: " + toTwoDecimalString(rating) + "/5.0 | Earnings: $" + toTwoDecimalString(earnings), COLOR_CYAN, false);
        printLineWithDashes();
        printLineWithDashes();
        printFormattedText("Menu Actions:", COLOR_MAGENTA, true);
        for (int i = 0; i < 5; i++)
        {
            if(i == choice)
                printFormattedText(string("==> ") + to_string(i+1) + ". " + options[i], COLOR_YELLOW, true);
            else
                printFormattedText(to_string(i+1) + ". " + options[i], COLOR_WHITE, true);
        }
        printLineWithDashes();
        pressedKey = _getch();
        if ((pressedKey == 'w' || pressedKey == 'W' || pressedKey == 72) && choice > 0) choice--;
        else if ((pressedKey == 's' || pressedKey == 'S' || pressedKey == 80) && choice < maxChoices) choice++;
        else if (pressedKey == '\r')
        {
            switch (choice)
            {
            case 0: editDetails(); break;
            case 1: postVehicle(inventory); break;
            case 2: viewMyListings(inventory); break;
            case 3:
            {
                // Build flat bookings list from context — simplified
                // In real flow, admin manages this. For now, just show message.
                printFormattedText("Use Admin Dashboard to resolve disputes.", COLOR_YELLOW, true);
                system("pause");
                break;
            }
            case 4:
                // Audit log removed
                exitStatus = true;
                break;
            }
        }
    } while (!exitStatus);
}

Lessor::~Lessor() { lessorsCount--; }
int Lessor::lessorsCount = 0;
int Lessor::lessorIDCounter = 0;
