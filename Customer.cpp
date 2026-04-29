#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <cctype>
#include <conio.h>
#include <cstdlib>

#include "Customer.h"
#include "FintechEngine.h"
#include "Common.h"
using namespace std;

Customer::Customer() : trustScore(5.0), loyaltyPoints(0)
{
    customersCount++;
    customerIDCounter++;
    generateUserID();
}

Customer::Customer(const string &name, const string &email, const string &pass, const string &phoneNum, const string &address, const string &cnic) : User(name, email, pass, phoneNum, address, "Customer", cnic), trustScore(5.0), loyaltyPoints(0)
{
    customersCount++;
    customerIDCounter++;
    generateUserID();
}

void Customer::setCustomerIDCounter(int count) { customerIDCounter = count; }
int Customer::getCustomersCount() { return customersCount; }
const vector<Booking>& Customer::getBookings() const { return bookings; }

void Customer::generateUserID()
{
    stringstream ss;
    ss << "UC-" << setw(4) << setfill('0') << customerIDCounter;
    userID = ss.str();
}

void Customer::incrementOrDecrementIDCounter(bool isIncrement)
{
    (isIncrement) ? customerIDCounter++ : customerIDCounter--;
}

void Customer::addBooking(Booking &b) { bookings.push_back(b); }
const vector<Booking>& Customer::getBookingVector() const { return bookings; }

void Customer::setTrustScore(double score)
{
    if (score < 1.0) trustScore = 1.0;
    else if (score > 5.0) trustScore = 5.0;
    else trustScore = score;
}
double Customer::getTrustScore() const { return trustScore; }
void Customer::penalizeTrust(double amount)
{
    trustScore -= amount;
    if (trustScore < 1.0) trustScore = 1.0;
}
Wallet& Customer::getWallet() { return wallet; }
const Wallet& Customer::getWalletConst() const { return wallet; }

void Customer::viewWallet() const
{
    system("cls");
    printLineWithDashes();
    printFormattedText("Wallet Overview", COLOR_BLUE, true);
    printLineWithDashes();
    printLineWithDashes();
    printFormattedText(wallet.toDisplayString(), COLOR_GREEN, false);
    printFormattedText("Trust Score: " + toTwoDecimalString(trustScore) + " / 5.00", COLOR_YELLOW, false);
    printFormattedText("Loyalty Points: " + to_string(loyaltyPoints), COLOR_MAGENTA, false);
    printLineWithDashes();
    system("pause");
}

void Customer::topUpWallet()
{
    double amount;
    system("cls");
    printLineWithDashes();
    printFormattedText("Top Up Wallet", COLOR_BLUE, true);
    printLineWithDashes();
    printFormattedText(wallet.toDisplayString(), COLOR_GREEN, false);
    do {
        printFormattedText("Enter amount to deposit:", COLOR_WHITE, false);
        printInputPrompt();
        cin >> amount;
        cin.ignore();
        if (amount <= 0)
            printFormattedText("Amount must be positive!", COLOR_RED, false);
    } while (amount <= 0);
    wallet.deposit(amount);
    // Audit log removed
    printLineWithDashes();
    printFormattedText("Deposit successful! " + wallet.toDisplayString(), COLOR_GREEN, true);
    printLineWithDashes();
    system("pause");
}

void Customer::editDetails()
{
    string newName, newEmail, newPass, newPhone, newAddress;
    system("cls");
    printLineWithDashes();
    printFormattedText("Editing Customer Details", COLOR_BLUE, true);
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
    printFormattedText("Current Phone Number: " + userPhoneNumber, COLOR_WHITE, false);
    printFormattedText("Enter new phone number: ", COLOR_WHITE, false);
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
    printFormattedText("Phone Number: " + newPhone, COLOR_WHITE, false);
    printFormattedText("Address: " + newAddress, COLOR_WHITE, false);
    printFormattedText("Save changes? (Y/N): ", COLOR_WHITE, false);
    printInputPrompt();
    cin >> confirmation;
    cin.ignore();
    if (confirmation == 'y' || confirmation == 'Y')
    {
        updateUserProfile(newName, newEmail, newPass, newPhone, newAddress);
        printLineWithDashes();
        printFormattedText("Customer profile updated successfully!", COLOR_GREEN, true);
    }
    else
    {
        printLineWithDashes();
        printFormattedText("Discarding the changes made.", COLOR_RED, true);
    }
    printLineWithDashes();
    system("pause");
}

void Customer::rentVehicle(vector <Vehicle*> &inventory)
{
    Booking *newBooking;
    string options[3] = {"Car", "Bike", "Truck"};
    int i, numDays;
    int choice = 0, maxChoices = 2;
    bool optionChosen = false, flag = false;
    char pressedKey, confirmation;
    string vehicleTypeChosen, id;

    do
    {
        system("cls");
        printLineWithDashes();
        printFormattedText("Renting A Vehicle", COLOR_BLUE, true);
        printLineWithDashes();
        printLineWithDashes();
        printFormattedText("Choose the vehicle type to rent:", COLOR_WHITE, false);
        for (int i = 0; i < 3; i++)
        {
            if(i == choice)
                printFormattedText(string("==> ") + to_string(i + 1) + ". " + options[i], COLOR_YELLOW, false);
            else
                printFormattedText(to_string(i + 1) + ". " + options[i], COLOR_WHITE, false);
        }
        printLineWithDashes();
        pressedKey = _getch();
        if ((pressedKey == 'w' || pressedKey == 'W'|| pressedKey == 72) && (choice > 0)) choice--;
        else if ((pressedKey == 's' || pressedKey == 'S' || pressedKey == 80) && (choice < maxChoices)) choice++;
        else if (pressedKey == '\r')
        {
            vehicleTypeChosen = options[choice];
            optionChosen = true;
        }
    } while (!optionChosen);

    printFormattedText("Displaying all available " + vehicleTypeChosen + "s to rent from", COLOR_MAGENTA, true);
    printLineWithSpaces();

    bool anyAvailable = false;
    for (i = 0; i < (int)inventory.size(); i++)
    {
        if (inventory[i]->getVehicleType() == vehicleTypeChosen && inventory[i]->getAvailability()
            && inventory[i]->getVerificationStatus() == "Verified")
        {
            cout << *inventory[i];
            anyAvailable = true;
        }
    }
    if (!anyAvailable)
    {
        printFormattedText("No available " + vehicleTypeChosen + "s at the moment.", COLOR_RED, true);
        printLineWithDashes();
        system("pause");
        return;
    }

    printLineWithSpaces();
    printFormattedText("Enter vehicle ID to rent:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, id);

    for (i = 0; i < (int)inventory.size(); i++)
    {
        if(inventory[i]->getVehicleType() == vehicleTypeChosen && inventory[i]->getAvailability()
           && inventory[i]->getVerificationStatus() == "Verified"
           && lowercaseString(id) == lowercaseString(inventory[i]->getVehicleID()))
        { flag = true; break; }
    }
    while (!flag)
    {
        printFormattedText("Invalid ID! Try again: ", COLOR_WHITE, false);
        printInputPrompt();
        getline(cin, id);
        for (i = 0; i < (int)inventory.size(); i++)
        {
            if (inventory[i]->getVehicleType() == vehicleTypeChosen && inventory[i]->getAvailability()
                && inventory[i]->getVerificationStatus() == "Verified"
                && lowercaseString(id) == lowercaseString(inventory[i]->getVehicleID()))
            { flag = true; break; }
        }
    }

    /* Anti-Fraud: Block luxury for low trust */
    if (vehicleTypeChosen == "Car")
    {
        Car* carPtr = dynamic_cast<Car*>(inventory[i]);
        if (carPtr && carPtr->isLuxury() && trustScore < 3.0)
        {
            printLineWithDashes();
            printFormattedText("ACCESS DENIED: Trust Score (" + toTwoDecimalString(trustScore) + ") < 3.0. Luxury blocked.", COLOR_RED, true);
            // Audit log removed
            printLineWithDashes();
            system("pause");
            return;
        }
    }

    do {
        printFormattedText("Enter rental duration (days):", COLOR_WHITE, false);
        printInputPrompt();
        cin >> numDays;
        if (numDays <= 0) printFormattedText("Invalid! Enter positive value.", COLOR_WHITE, false);
    } while (numDays <= 0);
    cin.ignore();

    /* Insurance Selection */
    string insuranceTier;
    char insChoice;
    printLineWithDashes();
    printFormattedText("Select Insurance Tier:", COLOR_CYAN, true);
    printFormattedText("1. Basic  (free, deposit required)", COLOR_WHITE, false);
    printFormattedText("2. Premium (+15%, lower/no deposit)", COLOR_WHITE, false);
    printInputPrompt();
    cin >> insChoice;
    cin.ignore();
    insuranceTier = (insChoice == '2') ? "Premium" : "Basic";

    bool isLux = false;
    if (vehicleTypeChosen == "Car")
    {
        Car* carPtr = dynamic_cast<Car*>(inventory[i]);
        if (carPtr) isLux = carPtr->isLuxury();
    }

    FintechEngine::displayPriceBreakdown(inventory[i]->getRatePerDay(), numDays, isLux, insuranceTier);
    double totalCost = FintechEngine::calculateTotalCost(inventory[i]->getRatePerDay(), numDays, insuranceTier);
    double deposit = FintechEngine::calculateDeposit(isLux, insuranceTier, totalCost);
    double totalCharge = totalCost + deposit;

    if (wallet.getAvailableBalance() < totalCharge)
    {
        printFormattedText("INSUFFICIENT FUNDS! Need $" + toTwoDecimalString(totalCharge) + ", have $" + toTwoDecimalString(wallet.getAvailableBalance()), COLOR_RED, true);
        printLineWithDashes();
        system("pause");
        return;
    }

    newBooking = new Booking(inventory[i]->getVehicleID(), userID, numDays, inventory[i]->getRatePerDay());
    newBooking->setRentalCost(totalCost);
    newBooking->setInsuranceType(insuranceTier);
    newBooking->setSecurityDeposit(deposit);
    newBooking->setOwnerID(inventory[i]->getOwnerID());
    newBooking->setStatus(Booking::STATUS_PENDING_APPROVAL);

    string pickupPath;
    printFormattedText("Enter pickup video path/URL (Enter to skip):", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, pickupPath);
    newBooking->setPickupVideoPath(pickupPath);

    printFormattedText("Confirm rent vehicle (" + id + ")? (Y/N):", COLOR_WHITE, false);
    printInputPrompt();
    cin >> confirmation;
    cin.ignore();

    if (confirmation == 'y' || confirmation == 'Y')
    {
        // Only lock security deposit at booking time. Rental payment is processed on completion.
        wallet.lock(deposit);
        bookings.push_back(*newBooking);
        inventory[i]->setAvailability(false);
        printLineWithDashes();
        printFormattedText("Booking created and deposit locked. Awaiting owner approval.", COLOR_GREEN, true);
        printFormattedText(wallet.toDisplayString(), COLOR_CYAN, false);
    }
    else
    {
        newBooking->incrementOrDecrementIDCounter(false);
        delete newBooking;
        printLineWithDashes();
        printFormattedText("Discarding changes.", COLOR_RED, true);
    }
    printLineWithDashes();
    system("pause");
}

void Customer::returnVehicle(vector <Vehicle*> &inventory)
{
    int i;
    string id;
    char confirmation;
    bool flag = false;
    system("cls");
    printLineWithDashes();
    printFormattedText("Returning Rented Vehicle", COLOR_BLUE, true);
    printLineWithDashes();
    printLineWithDashes();
    printFormattedText("Enter vehicle ID to return:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, id);

    for (i = 0; i < (int)bookings.size(); i++)
    {
        if (lowercaseString(id) == lowercaseString(bookings[i].getBookedVehicleID()) && bookings[i].getStatus() == Booking::STATUS_ACTIVE)
        { flag = true; break; }
    }
    while (!flag)
    {
        printFormattedText("Invalid ID! Try again:", COLOR_WHITE, false);
        printInputPrompt();
        getline(cin, id);
        for (i = 0; i < (int)bookings.size(); i++)
        {
            if (lowercaseString(id) == lowercaseString(bookings[i].getBookedVehicleID()) && bookings[i].getStatus() == Booking::STATUS_ACTIVE)
            { flag = true; break; }
        }
    }

    string returnPath, checklist;
    printFormattedText("Enter return video path/URL (Enter to skip):", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, returnPath);
    
    printFormattedText("Enter condition checklist (e.g., 'no_scratches,clean'):", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, checklist);

    printFormattedText("Confirm return (" + id + ")? (Y/N):", COLOR_WHITE, false);
    printInputPrompt();
    cin >> confirmation;
    cin.ignore();

    if (confirmation == 'y' || confirmation == 'Y')
    {
        for (int j = 0; j < (int)bookings.size(); j++)
        {
            if(lowercaseString(bookings[j].getBookedVehicleID()) == lowercaseString(id) && bookings[j].getBookedCustomerID() == userID)
            {
                for (auto &veh : inventory)
                {
                    if (lowercaseString(veh->getVehicleID()) == lowercaseString(id))
                    { veh->setAvailability(true); break; }
                }
                bookings[j].setReturnVideoPath(returnPath);
                bookings[j].setCustomerChecklist(checklist); // Set checklist
                // Move to return completed -> pending inspection for owner/admin
                bookings[j].setStatus(Booking::STATUS_RETURN_COMPLETED);
                printLineWithDashes();
                printFormattedText("Return recorded. Awaiting owner inspection/admin review.", COLOR_GREEN, true);
                printFormattedText("Deposit remains in escrow until inspection is cleared.", COLOR_WHITE, true);
                printFormattedText(wallet.toDisplayString(), COLOR_GREEN, false);
                break;
            }
        }
    }
    else
    {
        printLineWithDashes();
        printFormattedText("Discarding changes.", COLOR_RED, true);
    }
    printLineWithDashes();
    system("pause");
}

void Customer::viewAllBookings() const
{
    system("cls");
    printLineWithDashes();
    printFormattedText("All Bookings", COLOR_BLUE, true);
    printLineWithDashes();
    printLineWithDashes();
    printFormattedText("Bookings of " + userName + " (" + userID + "):", COLOR_MAGENTA, true);
    printLineWithSpaces();
    if (bookings.empty())
        printFormattedText("No active bookings.", COLOR_WHITE, true);
    else
        for (int i = 0; i < (int)bookings.size(); i++)
            bookings[i].displayBookingDetails();
    printLineWithDashes();
    system("pause");
}

void Customer::userConsole(vector <Vehicle*> &inventory)
{
    string options[7] = {
        "Edit Details", "Rent a Vehicle", "Return a Vehicle",
        "View All Bookings", "View Wallet & Trust", "Top Up Wallet", "Sign Out"
    };
    int choice = 0, maxChoices = 6;
    bool exitStatus = false;
    char pressedKey;
    do
    {
        system("cls");
        printLineWithDashes();
        printFormattedText("Customer Console", COLOR_BLUE, true);
        printLineWithDashes();
        printFormattedText("Welcome, " + userName + "!", COLOR_WHITE, true);
        printFormattedText("Trust: " + toTwoDecimalString(trustScore) + "/5.0 | " + wallet.toDisplayString(), COLOR_CYAN, false);
        printLineWithDashes();
        printLineWithDashes();
        printFormattedText("Menu Actions:", COLOR_MAGENTA, true);
        for (int i = 0; i < 7; i++)
        {
            if(i == choice)
                printFormattedText(string("==> ") + to_string(i + 1) + ". " + options[i], COLOR_YELLOW, true);
            else
                printFormattedText(to_string(i + 1) + ". " + options[i], COLOR_WHITE, true);
        }
        printLineWithDashes();
        pressedKey = _getch();
        if ((pressedKey == 'w' || pressedKey == 'W' || pressedKey == 72) && (choice > 0)) choice--;
        else if ((pressedKey == 's' || pressedKey == 'S' || pressedKey == 80) && (choice < maxChoices)) choice++;
        else if (pressedKey == '\r')
        {
            switch (choice)
            {
            case 0: editDetails(); break;
            case 1: rentVehicle(inventory); break;
            case 2: returnVehicle(inventory); break;
            case 3: viewAllBookings(); break;
            case 4: viewWallet(); break;
            case 5: topUpWallet(); break;
            case 6: // Audit log removed
                exitStatus = true; break;
            }
        }
    } while(!exitStatus);
}

Customer::~Customer() { customersCount--; }
int Customer::customersCount = 0;
int Customer::customerIDCounter = 0;