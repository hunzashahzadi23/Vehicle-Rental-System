#include "SystemManager.h"
#include <iostream>

SystemManager* SystemManager::instance = nullptr;

SystemManager* SystemManager::getInstance() {
    if (instance == nullptr) {
        instance = new SystemManager();
    }
    return instance;
}

SystemManager::~SystemManager() {
    shutdown();
}

void SystemManager::addUser(User* u) {
    if (u) users.push_back(u);
}

User* SystemManager::findUserByEmail(const std::string& email) {
    auto it = std::find_if(users.begin(), users.end(), [&](User* u) {
        return u->getUserEmail() == email;
    });
    return (it != users.end()) ? *it : nullptr;
}

User* SystemManager::findUserByID(const std::string& id) {
    auto it = std::find_if(users.begin(), users.end(), [&](User* u) {
        return u->getUserID() == id;
    });
    return (it != users.end()) ? *it : nullptr;
}

void SystemManager::addVehicle(Vehicle* v) {
    if (v) inventory.push_back(v);
}

std::vector<Vehicle*> SystemManager::getAvailableVehicles() {
    std::vector<Vehicle*> available;
    for (auto v : inventory) {
        if (v->getAvailability() && v->getVerificationStatus() == "Verified") {
            available.push_back(v);
        }
    }
    return available;
}

Vehicle* SystemManager::findVehicleByID(const std::string& id) {
    auto it = std::find_if(inventory.begin(), inventory.end(), [&](Vehicle* v) {
        return v->getVehicleID() == id;
    });
    return (it != inventory.end()) ? *it : nullptr;
}

void SystemManager::sortVehiclesByPrice(bool ascending) {
    std::sort(inventory.begin(), inventory.end(), [&](Vehicle* a, Vehicle* b) {
        return ascending ? (a->getRatePerDay() < b->getRatePerDay()) : (a->getRatePerDay() > b->getRatePerDay());
    });
}

void SystemManager::shutdown() {
    for (User* u : users) delete u;
    for (Vehicle* v : inventory) delete v;
    users.clear();
    inventory.clear();
}
