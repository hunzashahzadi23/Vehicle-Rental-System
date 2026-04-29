#ifndef FAVORITE_H
#define FAVORITE_H

#include <string>
#include <vector>

class Favorite {
private:
    std::string userId;
    std::string vehicleId;
    std::string addedAt;

public:
    Favorite();
    Favorite(std::string uId, std::string vId, std::string date);

    // Encapsulation
    std::string getUserId() const { return userId; }
    std::string getVehicleId() const { return vehicleId; }
    std::string getAddedAt() const { return addedAt; }

    // Persistence
    std::string toCSV() const;
    static Favorite fromCSV(const std::string& line);
};

#endif
