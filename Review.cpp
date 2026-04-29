#include "Review.h"
#include <sstream>

Review::Review() : rating(0.0f) {}

Review::Review(std::string vId, std::string cId, float r, std::string c, std::string d)
    : vehicleId(vId), customerId(cId), rating(r), comment(c), date(d) {}

std::string Review::toCSV() const {
    return vehicleId + "," + customerId + "," + std::to_string(rating) + "," + comment + "," + date;
}

Review Review::fromCSV(const std::string& line) {
    std::stringstream ss(line);
    std::string vId, cId, rStr, c, d;
    std::getline(ss, vId, ',');
    std::getline(ss, cId, ',');
    std::getline(ss, rStr, ',');
    std::getline(ss, c, ',');
    std::getline(ss, d, ',');
    return Review(vId, cId, std::stof(rStr), c, d);
}
