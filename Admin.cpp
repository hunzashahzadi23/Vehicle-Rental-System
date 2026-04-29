#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <cctype>
#include <conio.h>
#include <cstdlib>

#include "Admin.h"
#include "VerificationEngine.h"
#include "Common.h"
using namespace std;

Admin::Admin() : customersCtx(nullptr)
{
    adminsCount++;
    adminIDCounter++;
    generateUserID();
}

Admin::Admin(const string &name, const string &email, const string &pass, const string &phoneNum, const string &address, const string &cnic) : User(name, email, pass, phoneNum, address, "Admin", cnic), customersCtx(nullptr)
{
    adminsCount++;
    adminIDCounter++;
    generateUserID();
}

void Admin::setCustomersContext(vector<Customer*>* ctx) { customersCtx = ctx; }

void Admin::setAdminIDCounter(int count) { adminIDCounter = count; }
int Admin::getAdminsCount() { return adminsCount; }

void Admin::generateUserID()
{
    stringstream ss;
    ss << "UA-" << setw(4) << setfill('0') << adminIDCounter;
    userID = ss.str();
}

void Admin::incrementOrDecrementIDCounter(bool isIncrement)
{
    (isIncrement) ? adminIDCounter++ : adminIDCounter--;
}

void Admin::editDetails()
{
    string newName, newEmail, newPass, newPhone, newAddress;
    system("cls");
    printLineWithDashes();
    printFormattedText("Editing Admin Details", COLOR_BLUE, true);
    printLineWithDashes();
    printLineWithDashes();
    printFormattedText("Current Username: " + userName, COLOR_WHITE, false);
    printFormattedText("Enter new username:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, newName);
    printLineWithSpaces();
    printFormattedText("Current Email: " + userEmail, COLOR_WHITE, false);
    printFormattedText("Enter new email: ", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, newEmail);
    while (!isEmailValid(newEmail))
    {
        printFormattedText("Invalid email! Try again: ", COLOR_WHITE, false);
        printInputPrompt();
        getline(cin, newEmail);
    }
    printLineWithSpaces();
    printFormattedText("Current Password: " + userPassword, COLOR_WHITE, false);
    printFormattedText("Enter new password: ", COLOR_WHITE, false);
    printInputPrompt();
    newPass = maskedPassword();
    cout << endl;
    printLineWithSpaces();
    printFormattedText("Current Phone: " + userPhoneNumber, COLOR_WHITE, false);
    printFormattedText("Enter new phone: ", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, newPhone);
    printLineWithSpaces();
    printFormattedText("Current Address: " + userAddress, COLOR_WHITE, false);
    printFormattedText("Enter new address: ", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, newAddress);
    printLineWithDashes();
    char confirmation;
    printFormattedText("Username: " + newName, COLOR_WHITE, false);
    printFormattedText("Email: " + newEmail, COLOR_WHITE, false);
    printFormattedText("Password: " + string(newPass.length(), '*'), COLOR_WHITE, false);
    printFormattedText("Phone: " + newPhone, COLOR_WHITE, false);
    printFormattedText("Address: " + newAddress, COLOR_WHITE, false);
    printFormattedText("Save changes? (Y/N): ", COLOR_WHITE, false);
    printInputPrompt();
    cin >> confirmation;
    cin.ignore();
    if (confirmation == 'y' || confirmation == 'Y')
    {
        updateUserProfile(newName, newEmail, newPass, newPhone, newAddress);
        printLineWithDashes();
        printFormattedText("Admin profile updated!", COLOR_GREEN, true);
    }
    else
    {
        printLineWithDashes();
        printFormattedText("Discarding changes.", COLOR_RED, true);
    }
    printLineWithDashes();
    system("pause");
}

void Admin::addVehicleToInventory(vector <Vehicle*> &inventory)
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
        printFormattedText("Adding New Vehicle To Inventory", COLOR_BLUE, true);
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
    newVehicle->setVerificationStatus("Verified"); // Admin-added = auto-verified

    printFormattedText("Confirm add vehicle? (Y/N): ", COLOR_WHITE, false);
    printInputPrompt();
    cin >> confirmation;
    cin.ignore();
    if (confirmation == 'y' || confirmation == 'Y')
    {
        inventory.push_back(newVehicle);
        // Audit log removed
        printLineWithDashes();
        printFormattedText("Vehicle (" + newVehicle->getVehicleID() + ") added!", COLOR_GREEN, true);
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

void Admin::removeVehicleFromInventory(vector <Vehicle*> &inventory)
{
    string id;
    bool flag = false, alreadyRented = true;
    char confirmation;
    int i;
    system("cls");
    printLineWithDashes();
    printFormattedText("Removing Vehicle From Inventory", COLOR_BLUE, true);
    printLineWithDashes();
    printLineWithDashes();
    for (i = 0; i < (int)inventory.size(); i++)
        printFormattedText("Vehicle " + to_string(i+1) + ": " + inventory[i]->getVehicleID() + " | " + inventory[i]->getVehicleType() + " | Avail: " + (inventory[i]->getAvailability() ? "Yes" : "No") + " | Status: " + inventory[i]->getVerificationStatus(), COLOR_WHITE, false);

    printLineWithSpaces();
    printFormattedText("Enter vehicle ID to remove:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, id);
    for (i = 0; i < (int)inventory.size(); i++)
    {
        if (lowercaseString(id) == lowercaseString(inventory[i]->getVehicleID()) && inventory[i]->getAvailability())
        { alreadyRented = false; flag = true; break; }
        else if (lowercaseString(id) == lowercaseString(inventory[i]->getVehicleID()) && !inventory[i]->getAvailability())
            break;
    }
    while (!flag)
    {
        if (i == (int)inventory.size())
            printFormattedText("Invalid ID! Try again:", COLOR_WHITE, false);
        else if (alreadyRented)
            printFormattedText("Vehicle is currently rented! Try another:", COLOR_WHITE, false);
        printInputPrompt();
        getline(cin, id);
        for (i = 0; i < (int)inventory.size(); i++)
        {
            if (lowercaseString(id) == lowercaseString(inventory[i]->getVehicleID()) && inventory[i]->getAvailability())
            { alreadyRented = false; flag = true; break; }
            else if (lowercaseString(id) == lowercaseString(inventory[i]->getVehicleID()) && !inventory[i]->getAvailability())
                break;
        }
    }
    printFormattedText("Confirm remove (" + id + ")? (Y/N):", COLOR_WHITE, false);
    printInputPrompt();
    cin >> confirmation;
    cin.ignore();
    if (confirmation == 'y' || confirmation == 'Y')
    {
        delete inventory[i];
        inventory.erase(inventory.begin() + i);
        printLineWithDashes();
        printFormattedText("Vehicle removed!", COLOR_GREEN, true);
    }
    else
    {
        printLineWithDashes();
        printFormattedText("Discarding.", COLOR_RED, true);
    }
    printLineWithDashes();
    system("pause");
}

void Admin::viewAllVehicles(const vector <Vehicle*> &inventory)
{
    system("cls");
    printLineWithDashes();
    printFormattedText("All Vehicles In Inventory", COLOR_BLUE, true);
    printLineWithDashes();
    printLineWithDashes();
    for (int i = 0; i < (int)inventory.size(); i++)
        cout << *inventory[i];
    printFormattedText("Total vehicles: " + to_string(Vehicle::getVehiclesCount()), COLOR_WHITE, false);
    printFormattedText("Cars: " + to_string(Car::getCarsCount()) + " | Bikes: " + to_string(Bike::getBikesCount()) + " | Trucks: " + to_string(Truck::getTrucksCount()), COLOR_WHITE, false);
    printLineWithDashes();
    system("pause");
}

/* ── NEW: Vehicle Verification (God View) ────────────────────────── */
void Admin::verifyVehicleListings(vector <Vehicle*> &inventory)
{
    system("cls");
    printLineWithDashes();
    printFormattedText("Vehicle Verification Center", COLOR_BLUE, true);
    printLineWithDashes();
    printLineWithDashes();
    
    bool anyPending = false;
    for (int i = 0; i < (int)inventory.size(); i++)
    {
        if (inventory[i]->getVerificationStatus() == "Pending")
        {
            cout << *inventory[i];
            anyPending = true;
        }
    }
    if (!anyPending)
    {
        printFormattedText("No pending vehicle listings to review.", COLOR_GREEN, true);
        printLineWithDashes();
        system("pause");
        return;
    }

    string id;
    printFormattedText("Enter Vehicle ID to review:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, id);

    for (int i = 0; i < (int)inventory.size(); i++)
    {
        if (lowercaseString(id) == lowercaseString(inventory[i]->getVehicleID()) && inventory[i]->getVerificationStatus() == "Pending")
        {
            char decision;
            printFormattedText("1. APPROVE (Verify)  2. REJECT", COLOR_YELLOW, false);
            printInputPrompt();
            cin >> decision;
            cin.ignore();
            if (decision == '1')
            {
                inventory[i]->setVerificationStatus("Verified");
                // Audit log removed
                printFormattedText("Vehicle " + id + " VERIFIED!", COLOR_GREEN, true);
            }
            else
            {
                inventory[i]->setVerificationStatus("Rejected");
                // Audit log removed
                printFormattedText("Vehicle " + id + " REJECTED.", COLOR_RED, true);
            }
            printLineWithDashes();
            system("pause");
            return;
        }
    }
    printFormattedText("Vehicle not found or not pending.", COLOR_RED, true);
    printLineWithDashes();
    system("pause");
}

/* ── NEW: Dispute Resolution Center ──────────────────────────────── */
void Admin::disputeResolutionCenter(vector<Customer*> &customers)
{
    system("cls");
    printLineWithDashes();
    printFormattedText("Dispute Resolution Center", COLOR_BLUE, true);
    printLineWithDashes();
    printLineWithDashes();

    // Show all disputed bookings across all customers
    bool anyDisputed = false;
    for (auto *c : customers)
    {
        const auto &bookings = c->getBookings();
        for (int j = 0; j < (int)bookings.size(); j++)
        {
            if (bookings[j].getStatus() == "Disputed")
            {
                bookings[j].displayBookingDetails();
                anyDisputed = true;
            }
        }
    }

    if (!anyDisputed)
    {
        printFormattedText("No disputed bookings to resolve.", COLOR_GREEN, true);
        printLineWithDashes();
        system("pause");
        return;
    }

    printFormattedText("Enter Booking ID to resolve:", COLOR_WHITE, false);
    printInputPrompt();
    string bID;
    getline(cin, bID);

    // Find the disputed booking
    for (auto *c : customers)
    {
        // We need non-const access — rebuild from vector
        vector<Booking> &bookings = const_cast<vector<Booking>&>(c->getBookings());
        for (int j = 0; j < (int)bookings.size(); j++)
        {
            if (lowercaseString(bookings[j].getBookingID()) == lowercaseString(bID) && bookings[j].getStatus() == "Disputed")
            {
                printLineWithDashes();
                printFormattedText("=== VIDEO AUDIT ===", COLOR_CYAN, true);
                printFormattedText("Pickup Video: " + (bookings[j].getPickupVideoPath().empty() ? "N/A" : bookings[j].getPickupVideoPath()), COLOR_WHITE, false);
                printFormattedText("Return Video: " + (bookings[j].getReturnVideoPath().empty() ? "N/A" : bookings[j].getReturnVideoPath()), COLOR_WHITE, false);
                printLineWithDashes();

                char decision;
                printFormattedText("1. Resolve in Favor of Customer (Release Escrow)  2. Resolve in Favor of Owner (Penalize Renter)", COLOR_YELLOW, false);
                printInputPrompt();
                cin >> decision;
                cin.ignore();

                if (decision == '1')
                {
                    double dep = bookings[j].getSecurityDeposit();
                    c->getWallet().release(dep);
                    bookings[j].setStatus("ResolvedFavorRenter");
                    // Audit log removed
                    printFormattedText("Resolved in Favor of CUSTOMER. Escrow released.", COLOR_GREEN, true);
                }
                else
                {
                    double dep = bookings[j].getSecurityDeposit();
                    c->getWallet().deduct(dep);
                    c->penalizeTrust(1.0);
                    bookings[j].setStatus("ResolvedFavorOwner");
                    // Audit log removed
                    printFormattedText("Resolved in Favor of OWNER. Renter penalized.", COLOR_RED, true);
                }
                printLineWithDashes();
                system("pause");
                return;
            }
        }
    }
    printFormattedText("Booking not found.", COLOR_RED, true);
    printLineWithDashes();
    system("pause");
}

void Admin::viewUserActionLog(Customer* c) {
    if (!c) return;
    system("cls");
    printLineWithDashes();
    printFormattedText("Admin Friendship Access: ACTION LOG for " + c->getUserName(), COLOR_CYAN, true);
    printLineWithDashes();
    // Accessing protected member actionLog from User (friend of Customer which is a User)
    // Actually Admin is friend of Customer. actionLog is protected in User.
    // Friendship is not inherited, but Admin can access Customer's members.
    if (c->actionLog.empty()) {
        printFormattedText("No log entries found.", COLOR_WHITE, false);
    } else {
        for (const auto& log : c->actionLog) {
            printFormattedText(">> " + log, COLOR_WHITE, false);
        }
    }
    printLineWithDashes();
    system("pause");
}

void Admin::userConsole(vector <Vehicle*> &inventory)
{ 
    string options[7] = {
        "Edit Admin Details", "Add Vehicle", "Remove Vehicle",
        "View All Vehicles", "Verify Pending Listings",
        "Dispute Resolution Center", "Sign Out"
    };
    int choice = 0, maxChoices = 6;
    bool exitStatus = false;
    char pressedKey;
    do
    {
        system("cls");
        printLineWithDashes();
        printFormattedText("Admin Console (God View)", COLOR_BLUE, true);
        printLineWithDashes();
        printFormattedText("Welcome, Admin " + userName + "!", COLOR_WHITE, true);
        printLineWithDashes();
        printLineWithDashes();
        printFormattedText("Menu Actions:", COLOR_MAGENTA, true);
        for (int i = 0; i < 7; i++)
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
            case 1: addVehicleToInventory(inventory); break;
            case 2: removeVehicleFromInventory(inventory); break;
            case 3: viewAllVehicles(inventory); break;
            case 4: verifyVehicleListings(inventory); break;
            case 5:
                if (customersCtx)
                    disputeResolutionCenter(*customersCtx);
                else
                {
                    printFormattedText("Dispute Center unavailable (no customer context).", COLOR_RED, true);
                    system("pause");
                }
                break;
            case 6:
                // Audit log removed
                exitStatus = true;
                break;
            }
        }
    } while (!exitStatus);
}

Admin::~Admin() { adminsCount--; }
int Admin::adminsCount = 0;
int Admin::adminIDCounter = 0;