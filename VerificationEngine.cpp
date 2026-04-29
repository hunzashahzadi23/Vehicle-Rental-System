#include "VerificationEngine.h"
#include <fstream>
#include <sstream>
#include <vector>
#include <algorithm>
#include <cctype>
using namespace std;

namespace {
string trim(const string &value)
{
    const string whitespace = " \t\r\n";
    const size_t start = value.find_first_not_of(whitespace);
    if (start == string::npos) return "";
    const size_t end = value.find_last_not_of(whitespace);
    return value.substr(start, end - start + 1);
}

string lower(const string &value)
{
    string out = value;
    transform(out.begin(), out.end(), out.begin(), ::tolower);
    return out;
}

vector<string> splitCsv(const string &line)
{
    vector<string> fields;
    string field;
    stringstream ss(line);
    while (getline(ss, field, ',')) {
        fields.push_back(trim(field));
    }
    return fields;
}
}

bool VerificationEngine::verify(const string &plate, const string &cnic,
                                const string &registryFile)
{
    ifstream file(registryFile.c_str());
    if (!file.is_open()) return false;

    const string lookupPlate = lower(trim(plate));
    const string lookupCnic = trim(cnic);
    string line;
    bool headerSkipped = false;

    while (getline(file, line))
    {
        if (trim(line).empty()) continue;
        if (!headerSkipped) {
            headerSkipped = true;
            continue;
        }

        vector<string> row = splitCsv(line);
        if (row.size() < 3) continue;

        const string regPlate = lower(row[0]);
        const string ownerCnic = row[2];
        if (regPlate == lookupPlate && ownerCnic == lookupCnic) return true;
    }
    return false;
}

bool VerificationEngine::isPlateInRegistry(const string &plate,
                                           const string &registryFile)
{
    ifstream file(registryFile.c_str());
    if (!file.is_open()) return false;

    const string lookupPlate = lower(trim(plate));
    string line;
    bool headerSkipped = false;

    while (getline(file, line))
    {
        if (trim(line).empty()) continue;
        if (!headerSkipped) {
            headerSkipped = true;
            continue;
        }

        vector<string> row = splitCsv(line);
        if (row.empty()) continue;
        if (lower(row[0]) == lookupPlate) return true;
    }
    return false;
}
