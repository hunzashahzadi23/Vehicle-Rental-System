#ifndef SYSTEMMANAGER_H
#define SYSTEMMANAGER_H

#include <vector>
#include <string>
#include <algorithm>
#include "User.h"
#include "Vehicle.h"

/**
 * SystemManager — Implementing the SINGLETON PATTERN.
 * This class ensures only one instance of the rental system state exists.
 * It demonstrates advanced pointer management and STL integration.
 */
class SystemManager {
private:
    static SystemManager* instance;
    
    std::vector<User*> users;
    std::vector<Vehicle*> inventory;

    // Private constructor for Singleton
    SystemManager() {}

public:
    static SystemManager* getInstance();

    // Memory Management
    ~SystemManager();

    // User Operations
    void addUser(User* u);
    User* findUserByEmail(const std::string& email);
    User* findUserByID(const std::string& id);
    
    // Vehicle Operations
    void addVehicle(Vehicle* v);
    std::vector<Vehicle*> getAvailableVehicles();
    Vehicle* findVehicleByID(const std::string& id);

    // Advanced STL Logic: Sorting and Filtering
    void sortVehiclesByPrice(bool ascending = true);
    std::vector<Vehicle*> filterByLuxury(bool luxuryOnly);

    // Bulk Cleanup (Destructor Logic)
    void shutdown();

    // Getters for consoles
    const std::vector<User*>& getAllUsers() const { return users; }
    const std::vector<Vehicle*>& getInventory() const { return inventory; }
};

#endif
