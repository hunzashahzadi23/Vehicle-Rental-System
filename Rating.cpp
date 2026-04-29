#include "Rating.h"

Rating::Rating() : score(0.0f) {}

Rating::Rating(float s, std::string t, std::string ts)
    : score(s), type(t), timestamp(ts) {}

float Rating::calculateAverage(const std::vector<Rating>& ratings) {
    if (ratings.empty()) return 0.0f;
    float sum = 0;
    for (const auto& r : ratings) sum += r.score;
    return sum / ratings.size();
}

std::string Rating::toCSV() const {
    return std::to_string(score) + "," + type + "," + timestamp;
}
