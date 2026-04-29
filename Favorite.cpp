#include "Favorite.h"
#include <sstream>

Favorite::Favorite() {}

Favorite::Favorite(std::string uId, std::string vId, std::string date)
    : userId(uId), vehicleId(vId), addedAt(date) {}

std::string Favorite::toCSV() const {
    return userId + "," + vehicleId + "," + addedAt;
}

Favorite Favorite::fromCSV(const std::string& line) {
    std::stringstream ss(line);
    std::string uId, vId, d;
    std::getline(ss, uId, ',');
    std::getline(ss, vId, ',');
    std::getline(ss, d, ',');
    return Favorite(uId, vId, d);
}
