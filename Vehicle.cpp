#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <iomanip>
#include <cctype>
#include <conio.h>
#include <cstdlib>

#include "Vehicle.h"
using namespace std;

Vehicle::Vehicle() : brand(""), model(""), licensePlate(""), ratePerDay(0.0), isAvailable(false), ownerID(""), verificationStatus("Verified"), manufacturingYear(2020), mileage(0.0)
{
    vehiclesCount++;
}

Vehicle::Vehicle(const string &b, const string &m, const string &l, double rate, bool available, const string vT)
    : brand(b), model(m), licensePlate(l), ratePerDay(rate), isAvailable(available), vehicleType(vT), ownerID(""), verificationStatus("Verified"), manufacturingYear(2020), mileage(0.0)
{
    vehiclesCount++;
}

void Vehicle::addMaintenanceLog(const string& log) {
    maintenanceLogs.push_back(log);
}

void Vehicle::updateMileage(double miles) {
    mileage += miles;
}

bool Vehicle::isDueForMaintenance() const {
    return mileage > 10000.0; // Maintenance every 10,000 miles
}

/* Setters */
void Vehicle::setVehicleID(const string &id) { vehicleID = id; }
void Vehicle::setBrand(const string &b) { brand = b; }
void Vehicle::setModel(const string &m) { model = m; }
void Vehicle::setLicensePlate(const string &l) { licensePlate = l; }
void Vehicle::setRatePerDay(double rate) { ratePerDay = rate; }
void Vehicle::setAvailability(bool available) { isAvailable = available; }
void Vehicle::setVehicleType(const string &type) { vehicleType = type; } 
void Vehicle::setOwnerID(const string &id) { ownerID = id; }
void Vehicle::setVerificationStatus(const string &status) { verificationStatus = status; }

/* Getters */
string Vehicle::getVehicleID() const { return vehicleID; }
string Vehicle::getBrand() const { return brand; }
string Vehicle::getModel() const { return model; }
string Vehicle::getLicensePlate() const { return licensePlate; }
double Vehicle::getRatePerDay() const { return ratePerDay; }
bool Vehicle::getAvailability() const { return isAvailable; }
string Vehicle::getVehicleType() const { return vehicleType; }
string Vehicle::getOwnerID() const { return ownerID; }
string Vehicle::getVerificationStatus() const { return verificationStatus; }
int Vehicle::getVehiclesCount() { return vehiclesCount; }

Vehicle::~Vehicle() { vehiclesCount--; }

int Vehicle::vehiclesCount = 0;

ostream &operator<<(ostream &os, const Vehicle &v)
{
    v.displayVehicleDetails(os);
    return os;
}