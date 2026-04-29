#ifndef TRUCK_H
#define TRUCK_H

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
 * Truck inherits from Vehicle, adding specialized logistics data.
 * 
 * [PILLAR: POLYMORPHISM] 
 * Implements heavy-duty safety checks and load-capacity display logic.
 */
class Truck : public Vehicle 
{
    double loadCapacity;
    static int trucksCount;
    static int truckIDCounter;

public:
    Truck();
    Truck(const string &b, const string &m, const string &l, double rate, bool available, double lC);

    static void setTruckIDCounter(int count);
    void setLoadCapacity(double lC);
    double getLoadCapacity() const;
    static int getTrucksCount();
    string getAdditionalData() const override;

    void generateVehicleID() override;
    void incrementOrDecrementIDCounter(bool isIncrement) override;
    void displayVehicleDetails(ostream &os) const override;
    void addVehicle(vector <Vehicle*> &inventory) override;
    void performSafetyCheck() override;

    ~Truck();
};

#endif