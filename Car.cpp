#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <iomanip>
#include <cctype>
#include <conio.h>
#include <cstdlib>

#include "Car.h"
using namespace std;

Car::Car() : fuelType(""), luxury(false) 
{
    carsCount++;
    carIDCounter++;
    generateVehicleID();
}

Car::Car(const string &b, const string &m, const string &l, double rate, bool available, const string &f, bool isLux) : Vehicle(b, m, l, rate, available, "Car"), fuelType(f), luxury(isLux) 
{
    carsCount++;
    carIDCounter++;
    generateVehicleID();
}

void Car::setCarIDCounter(int count) { carIDCounter = count; }
void Car::setFuelType(const string &f) { fuelType = f; }
void Car::setLuxury(bool isLux) { luxury = isLux; }
string Car::getFuelType() const { return fuelType; }
bool Car::isLuxury() const { return luxury; }
int Car::getCarsCount() { return carsCount; }

/* getAdditionalData now returns "FuelType|Luxury" or "FuelType|Normal" */
string Car::getAdditionalData() const 
{ 
    return fuelType + "|" + (luxury ? "Luxury" : "Normal"); 
}

void Car::generateVehicleID()
{
    stringstream ss;
    ss << "VC-" << setw(4) << setfill('0') << carIDCounter;
    vehicleID = ss.str();
}

void Car::incrementOrDecrementIDCounter(bool isIncrement)
{
    (isIncrement) ? carIDCounter++ : carIDCounter--;
}

void Car::displayVehicleDetails(ostream &os) const
{
    printFormattedText("Vehicle ID: " + vehicleID, COLOR_WHITE, false);
    printFormattedText("Brand: " + brand + " | Model: " + model + " | Type: " + vehicleType, COLOR_WHITE, false);
    printFormattedText("Rate: $" + toTwoDecimalString(ratePerDay) + " | License Plate: " + licensePlate + " | Available: " + ((isAvailable) ? "Yes" : "No"), COLOR_WHITE, false);
    printFormattedText("Fuel Type: " + fuelType + " | Tier: " + (luxury ? "LUXURY" : "Normal"), COLOR_WHITE, false);
    if (!ownerID.empty())
        printFormattedText("Owner: " + ownerID + " | Verification: " + verificationStatus, COLOR_CYAN, false);
    printLineWithSpaces();
}

void Car::addVehicle(vector <Vehicle*> &inventory)
{
    printFormattedText("Enter the details of the new CAR below", COLOR_WHITE, false);
    printFormattedText("Enter the brand of the new car:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, brand);

    printFormattedText("Enter the model of the new car:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, model);

    bool flag;
    do
    {
        flag = false;
        printFormattedText("Enter the license plate of the new car:", COLOR_WHITE, false);
        printInputPrompt();
        getline(cin, licensePlate);

        if (!isValidLicensePlate(licensePlate))
        {
            printFormattedText("Invalid license plate! It must be in the format 'XXX-123'. Try again.", COLOR_RED, false);
        }
        
        for (Vehicle *v : inventory)
        {
            if (v->getLicensePlate() == licensePlate)
            {
                printFormattedText("Error: This license plate is already in use by another vehicle. Try a different one.", COLOR_RED, false);
                flag = true;
                break;
            }
        }
    } while(!isValidLicensePlate(licensePlate) || flag);

    do
    {
        printFormattedText("Enter the rate per day of the new car:", COLOR_WHITE, false);
        printInputPrompt();
        cin >> ratePerDay;
        if (ratePerDay <= 0)
        {
            printFormattedText("Invalid rate! Please enter a positive value.", COLOR_WHITE, false);
        }
    } while (ratePerDay <= 0);
    cin.ignore();

    printFormattedText("Enter the fuel type of the new car:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, fuelType);

    /* ── NEW: Luxury tier selection ─────────────────────────────── */
    char luxChoice;
    printFormattedText("Is this a LUXURY vehicle? (Y/N):", COLOR_YELLOW, false);
    printInputPrompt();
    cin >> luxChoice;
    cin.ignore();
    luxury = (luxChoice == 'y' || luxChoice == 'Y');

    isAvailable = true;
    vehicleType = "Car";
}

void Car::performSafetyCheck()
{
    printFormattedText("--- CAR SAFETY PROTOCOL ---", COLOR_CYAN, true);
    printFormattedText("Checking Brake Fluid Levels...", COLOR_WHITE, false);
    printFormattedText("Verifying Airbag Deployment Systems...", COLOR_WHITE, false);
    printFormattedText("Scanning OBD-II for Error Codes...", COLOR_WHITE, false);
    printFormattedText("Safety Rating: 5/5 Stars.", COLOR_GREEN, false);
}

Car::~Car() { carsCount--; }

int Car::carsCount = 0;
int Car::carIDCounter = 0;