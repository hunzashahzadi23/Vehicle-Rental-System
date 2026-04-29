#ifndef REVIEW_H
#define REVIEW_H

#include <iostream>
#include <string>
#include <vector>

class Review {
private:
    std::string vehicleId;
    std::string customerId;
    float rating;
    std::string comment;
    std::string date;

public:
    // Abstraction: Simplified constructor
    Review();
    Review(std::string vId, std::string cId, float r, std::string c, std::string d);

    // Encapsulation: Setters
    void setVehicleId(std::string id) { vehicleId = id; }
    void setCustomerId(std::string id) { customerId = id; }
    void setRating(float r) { rating = r; }
    void setComment(std::string c) { comment = c; }
    void setDate(std::string d) { date = d; }

    // Encapsulation: Getters
    std::string getVehicleId() const { return vehicleId; }
    std::string getCustomerId() const { return customerId; }
    float getRating() const { return rating; }
    std::string getComment() const { return comment; }
    std::string getDate() const { return date; }

    // Persistence: CSV Operations
    std::string toCSV() const;
    static Review fromCSV(const std::string& line);
};

#endif
