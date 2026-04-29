#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <algorithm>
#include <ctime>
#include "../../VerificationEngine.h"
#include "../../Wallet.h"
#include "../../Booking.h"
#include "../../Exceptions.h"
#include <iomanip>

using namespace std;

namespace {
string trim(const string& value) {
    const string ws = " \t\r\n";
    const size_t start = value.find_first_not_of(ws);
    if (start == string::npos) return "";
    const size_t end = value.find_last_not_of(ws);
    return value.substr(start, end - start + 1);
}

vector<string> splitCsv(const string& line) {
    vector<string> out;
    string field;
    stringstream ss(line);
    while (getline(ss, field, ',')) out.push_back(trim(field));
    return out;
}

vector<vector<string>> readCsvRows(const string& path) {
    ifstream file(path.c_str());
    vector<vector<string>> rows;
    if (!file.is_open()) return rows;
    string line;
    while (getline(file, line)) {
        if (trim(line).empty()) continue;
        rows.push_back(splitCsv(line));
    }
    return rows;
}

void writeCsvRows(const string& path, const vector<vector<string>>& rows) {
    ofstream file(path.c_str());
    if (!file.is_open()) {
        cerr << "ERR|Failed to open file for writing: " << path << endl;
        return;
    }
    for (const auto& row : rows) {
        for (size_t i = 0; i < row.size(); ++i) {
            file << row[i] << (i == row.size() - 1 ? "" : ",");
        }
        file << "\n";
    }
}

string nextUserId(const vector<vector<string>>& rows, const string& role) {
    string prefix = role == "Admin" ? "UA-" : (role == "Lessor" ? "UL-" : "UC-");
    int maxId = 0;
    for (size_t i = 1; i < rows.size(); ++i) {
        if (rows[i].empty()) continue;
        const string& id = rows[i][0];
        if (id.rfind(prefix, 0) != 0) continue;
        int num = atoi(id.substr(3).c_str());
        if (num > maxId) maxId = num;
    }
    stringstream ss;
    ss << prefix;
    ss.width(4);
    ss.fill('0');
    ss << (maxId + 1);
    return ss.str();
}

string getISOTimestamp() {
    time_t now;
    time(&now);
    char buf[sizeof "2011-10-08T07:07:09Z"];
    strftime(buf, sizeof buf, "%Y-%m-%dT%H:%M:%SZ", gmtime(&now));
    return string(buf);
}
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        cout << "ERR|Missing command";
        return 1;
    }

    const string command = argv[1];
    const string usersFile = "users.csv";
    const string registryFile = "govt_registry.csv";
    const string bookingsFile = "bookings.csv";
    const string favoritesFile = "favorites.csv";

    if (command == "login") {
        if (argc < 4) {
            cout << "ERR|Usage: login <email> <password>";
            return 1;
        }
        const string email = argv[2];
        const string password = argv[3];
        const auto rows = readCsvRows(usersFile);
        for (size_t i = 1; i < rows.size(); ++i) {
            if (rows[i].size() < 11) continue;
            if (rows[i][2] == email && rows[i][3] == password) {
                cout << "OK|" << rows[i][0] << "|" << rows[i][1] << "|" << rows[i][2] << "|" << rows[i][4]
                     << "|" << rows[i][5] << "|" << rows[i][8] << "|" << rows[i][9] << "|" << rows[i][10];
                return 0;
            }
        }
        cout << "ERR|Invalid credentials";
        return 1;
    }

    if (command == "register") {
        if (argc < 10) {
            cout << "ERR|Usage: register <role> <name> <email> <password> <phone> <address> <cnic> <initialWallet>";
            return 1;
        }
        const string role = argv[2];
        const string name = argv[3];
        const string email = argv[4];
        const string phone = argv[6];
        const string address = argv[7];
        const string cnic = argv[8];
        const string initialWallet = argv[9];

        auto rows = readCsvRows(usersFile);
        for (size_t i = 1; i < rows.size(); ++i) {
            if (rows[i].size() > 2 && rows[i][2] == email) {
                cout << "ERR|Email already registered";
                return 1;
            }
        }

        auto registryRows = readCsvRows(registryFile);
        bool cnicFound = false;
        for (size_t i = 1; i < registryRows.size(); ++i) {
            if (registryRows[i].size() > 2 && registryRows[i][2] == cnic) {
                cnicFound = true;
                break;
            }
        }
        if (!cnicFound) {
            cout << "ERR|CNIC not found in govt registry";
            return 1;
        }

        const string userId = nextUserId(rows, role);
        ofstream out(usersFile.c_str(), ios::app);
        if (!out.is_open()) {
            cout << "ERR|Cannot open users.csv";
            return 1;
        }
        out << "\n" << userId << "," << name << "," << email << "," << argv[5] << "," << role << "," << cnic << ","
            << phone << "," << address << ",3.0," << initialWallet << ",0";
        out.close();

        cout << "OK|" << userId << "|" << name << "|" << email << "|" << role << "|" << cnic << "|3.0|" << initialWallet << "|0";
        return 0;
    }

    if (command == "create_booking") {
        if (argc < 9) {
            cout << "ERR|Usage: create_booking <customerID> <vehicleID> <ownerID> <duration> <cost> <insurance> <deposit> <rentDate>";
            return 1;
        }
        const string customerID = argv[2];
        const string vehicleID = argv[3];
        const string ownerID = argv[4];
        const int duration = atoi(argv[5]);
        const double cost = atof(argv[6]);
        const string insurance = argv[7];
        const double deposit = atof(argv[8]);
        const string rentDate = (argc > 9) ? argv[9] : getISOTimestamp();

        auto users = readCsvRows(usersFile);
        bool userFound = false;
        for (size_t i = 1; i < users.size(); ++i) {
            if (users[i][0] == customerID) {
                userFound = true;
                double available = atof(users[i][9].c_str());
                double locked = atof(users[i][10].c_str());
                
                Wallet wallet(available, locked);
                try {
                    wallet.lock(deposit);
                    // Update user row
                    stringstream ssA, ssL;
                    ssA << fixed << setprecision(2) << wallet.getAvailableBalance();
                    ssL << fixed << setprecision(2) << wallet.getLockedBalance();
                    users[i][9] = ssA.str();
                    users[i][10] = ssL.str();
                } catch (const InsufficientFundsException& e) {
                    cout << "ERR|" << e.what();
                    return 1;
                }
                break;
            }
        }

        if (!userFound) {
            cout << "ERR|Customer not found";
            return 1;
        }

        // Save updated users
        writeCsvRows(usersFile, users);

        // Generate Booking ID
        auto bookings = readCsvRows(bookingsFile);
        stringstream ss;
        ss << "B-" << setfill('0') << setw(4) << (bookings.size());
        string bookingID = ss.str();

        // Hardcode PendingApproval status as requested
        string status = "PendingApproval";

        // Append to bookings.csv
        ofstream bOut(bookingsFile.c_str(), ios::app);
        // Schema: bookingID,vehicleID,customerID,ownerID,duration,cost,insurance,deposit,status,...
        bOut << "\n" << bookingID << "," << vehicleID << "," << customerID << "," << ownerID << ","
             << duration << "," << cost << "," << insurance << "," << deposit << "," << status
             << ",,,,,,,," << rentDate << "," << deposit << ",0,,, ,,, ,,,," << getISOTimestamp() << ",,,,";
        bOut.close();

        cout << "OK|" << bookingID << "|" << status;
        return 0;
    }

    if (command == "toggle_favorite") {
        if (argc < 4) {
            cout << "ERR|Usage: toggle_favorite <userID> <vehicleID>";
            return 1;
        }
        const string userID = argv[2];
        const string vehicleID = argv[3];
        auto favs = readCsvRows(favoritesFile);
        bool found = false;
        for (auto it = favs.begin(); it != favs.end(); ++it) {
            if ((*it).size() >= 2 && (*it)[0] == userID && (*it)[1] == vehicleID) {
                favs.erase(it);
                found = true;
                break;
            }
        }
        if (!found) {
            favs.push_back({userID, vehicleID, getISOTimestamp()});
        }
        writeCsvRows(favoritesFile, favs);
        
        // Return only user's favorites
        cout << "OK|";
        bool first = true;
        for (const auto& row : favs) {
            if (row[0] == userID) {
                if (!first) cout << "|";
                cout << row[1];
                first = false;
            }
        }
        return 0;
    }

    if (command == "get_favorites") {
        if (argc < 3) {
            cout << "ERR|Usage: get_favorites <userID>";
            return 1;
        }
        const string userID = argv[2];
        auto favs = readCsvRows(favoritesFile);
        cout << "OK|";
        bool first = true;
        for (const auto& row : favs) {
            if (row.size() >= 2 && row[0] == userID) {
                if (!first) cout << "|";
                cout << row[1];
                first = false;
            }
        }
        return 0;
    }

    if (command == "verify_vehicle") {
        if (argc < 4) {
            cout << "ERR|Usage: verify_vehicle <vehicleNumber> <ownerCnic>";
            return 1;
        }
        const string plate = argv[2];
        const string cnic = argv[3];
        const bool ok = VerificationEngine::verify(plate, cnic, registryFile);
        cout << (ok ? "OK|VERIFIED" : "ERR|NOT_FOUND");
        return ok ? 0 : 1;
    }

    cout << "ERR|Unknown command";
    return 1;
}
