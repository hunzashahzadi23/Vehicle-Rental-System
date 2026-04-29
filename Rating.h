#ifndef RATING_H
#define RATING_H

#include <string>
#include <vector>
#include <sstream>

class Rating {
private:
    float score;
    std::string type; // 'vehicle' or 'owner'
    std::string timestamp;

public:
    Rating();
    Rating(float s, std::string t, std::string ts);

    // Encapsulation: Setters
    void setScore(float s) { score = s; }
    void setType(std::string t) { type = t; }
    void setTimestamp(std::string ts) { timestamp = ts; }

    // Encapsulation: Getters
    float getScore() const { return score; }
    std::string getType() const { return type; }
    std::string getTimestamp() const { return timestamp; }

    // Logic: Static Method (Demonstrates shared class logic)
    static float calculateAverage(const std::vector<Rating>& ratings);

    // Persistence
    std::string toCSV() const;
};

#endif
