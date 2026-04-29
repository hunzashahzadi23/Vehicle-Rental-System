#ifndef CAR_H
#define CAR_H

#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <cctype>
#include <conio.h>
#include <cstdlib>

#include "Vehicle.h"
using namespace std;

/* 
 * [PILLAR: INHERITANCE] 
 * Car inherits all properties and methods from the Vehicle base class.
 * 
 * [PILLAR: POLYMORPHISM] 
 * Car overrides virtual methods like displayVehicleDetails to provide
 * specialized behavior for cars specifically.
 */
class Car : public Vehicle
{
    string fuelType;
    bool luxury;          // ← NEW: true = Luxury tier, false = Normal
    static int carsCount;
    static int carIDCounter;

public:
    Car();
    Car(const string &b, const string &m, const string &l, double rate, bool available, const string &f, bool isLux = false);

    static void setCarIDCounter(int count);
    void setFuelType(const string &f);
    void setLuxury(bool isLux);
    string getFuelType() const;
    bool isLuxury() const;
    static int getCarsCount();
    string getAdditionalData() const override;
    
    void generateVehicleID() override;
    void incrementOrDecrementIDCounter(bool isIncrement) override;
    void displayVehicleDetails(ostream &os) const override;
    void addVehicle(vector <Vehicle*> &inventory) override;
    void performSafetyCheck() override;

    ~Car();
};

#endif