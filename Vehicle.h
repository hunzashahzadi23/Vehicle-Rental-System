#ifndef VEHICLE_H
#define VEHICLE_H

#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <cctype>
#include <conio.h>
#include <cstdlib>


using namespace std;

/* 
 * [PILLAR: ABSTRACTION] 
 * This class serves as an abstract base for all vehicle types. 
 * It contains pure virtual functions (= 0) which force child classes 
 * to implement specific behaviors, hiding complexity from the main system.
 */
class Vehicle
{
protected:
    string vehicleID;
    string brand;
    string model;
    string licensePlate;
    double ratePerDay;
    bool isAvailable;
    string vehicleType;
    string ownerID;
    string verificationStatus;
    int manufacturingYear;
    double mileage;
    vector<string> maintenanceLogs;
    static int vehiclesCount;

public:
    Vehicle();
    Vehicle(const string &b, const string &m, const string &l, double rate, bool available, const string vT);

    /* Abstraction: Pure Virtual Functions */
    virtual void generateVehicleID() = 0;
    virtual void incrementOrDecrementIDCounter(bool isIncrement) = 0;
    virtual void displayVehicleDetails(ostream &os) const = 0;
    virtual void addVehicle(vector <Vehicle*> &inventory) = 0;
    virtual void performSafetyCheck() = 0;

    /* Encapsulation: Common Logic */
    void addMaintenanceLog(const string& log);
    void updateMileage(double miles);
    bool isDueForMaintenance() const;

    /* Setters */
    void setVehicleID(const string &id);
    void setBrand(const string &b);
    void setModel(const string &m);
    void setLicensePlate(const string &l);
    void setRatePerDay(double rate);
    void setAvailability(bool available);
    void setVehicleType(const string &type);
    void setOwnerID(const string &id);
    void setVerificationStatus(const string &status);
    void setManufacturingYear(int y) { manufacturingYear = y; }
    void setMileage(double m) { mileage = m; }

    /* Getters */
    virtual string getAdditionalData() const = 0;
    string getVehicleID() const;
    string getBrand() const;
    string getModel() const;
    string getLicensePlate() const;
    double getRatePerDay() const;
    bool getAvailability() const;
    string getVehicleType() const;
    string getOwnerID() const;
    string getVerificationStatus() const;
    int getManufacturingYear() const { return manufacturingYear; }
    double getMileage() const { return mileage; }
    static int getVehiclesCount();

    /* Polymorphism: Operator Overloading */
    friend ostream &operator<<(ostream &os, const Vehicle &v);
    bool operator>(const Vehicle& other) const { return this->ratePerDay > other.ratePerDay; }

    /* Destructor */
    virtual ~Vehicle();
};

ostream &operator<<(ostream &os, const Vehicle &v);

#endif