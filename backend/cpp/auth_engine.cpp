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
    bool inQuotes = false;
    for (size_t i = 0; i < line.size(); ++i) {
        char c = line[i];
        if (c == '"') { inQuotes = !inQuotes; }
        else if (c == ',' && !inQuotes) { out.push_back(trim(field)); field.clear(); }
        else { field.push_back(c); }
    }
    out.push_back(trim(field));
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
    ss.width(4); ss.fill('0');
    ss << (maxId + 1);
    return ss.str();
}

// Scan existing bookings for max numeric ID
string nextBookingId(const vector<vector<string>>& rows) {
    int maxId = 0;
    for (size_t i = 1; i < rows.size(); ++i) {
        if (rows[i].empty()) continue;
        const string& id = rows[i][0];
        if (id.rfind("B-", 0) != 0) continue;
        int num = atoi(id.substr(2).c_str());
        if (num > maxId) maxId = num;
    }
    stringstream ss;
    ss << "B-" << setfill('0') << setw(4) << (maxId + 1);
    return ss.str();
}

string getISOTimestamp() {
    time_t now; time(&now);
    char buf[sizeof "2011-10-08T07:07:09Z"];
    strftime(buf, sizeof buf, "%Y-%m-%dT%H:%M:%SZ", gmtime(&now));
    return string(buf);
}

string getTodayDate() {
    time_t now; time(&now);
    char buf[11];
    strftime(buf, sizeof buf, "%Y-%m-%d", localtime(&now));
    return string(buf);
}

string escapeJson(const string& s) {
    string out;
    for (char c : s) {
        if (c == '"') out += '\\"';
        else if (c == '\\') out += '\\\\';
        else if (c == '\n') out += "\\n";
        else out.push_back(c);
    }
    return out;
}

// Build a row of exactly 33 blank fields
vector<string> blankBookingRow(size_t n = 33) {
    return vector<string>(n, "");
}
}

int main(int argc, char* argv[]) {
    if (argc < 2) { cout << "ERR|Missing command"; return 1; }

    const string command = argv[1];
    const string usersFile    = "users.csv";
    const string registryFile = "govt_registry.csv";
    const string bookingsFile = "bookings.csv";
    const string favoritesFile= "favorites.csv";

    // ── LOGIN ─────────────────────────────────────────────────────────────
    if (command == "login") {
        if (argc < 4) { cout << "ERR|Usage: login <email> <password>"; return 1; }
        const string email = argv[2], password = argv[3];
        const auto rows = readCsvRows(usersFile);
        for (size_t i = 1; i < rows.size(); ++i) {
            if (rows[i].size() < 11) continue;
            if (rows[i][2] == email && rows[i][3] == password) {
                {
                    stringstream js;
                    js << "{\"id\":\"" << escapeJson(rows[i][0]) << "\",";
                    js << "\"name\":\"" << escapeJson(rows[i][1]) << "\",";
                    js << "\"email\":\"" << escapeJson(rows[i][2]) << "\",";
                    js << "\"role\":\"" << escapeJson(rows[i][4]) << "\",";
                    js << "\"cnic\":\"" << escapeJson(rows[i][5]) << "\",";
                    js << "\"trustScore\":\"" << escapeJson(rows[i][8]) << "\",";
                    js << "\"walletAvailable\":\"" << escapeJson(rows[i][9]) << "\",";
                    js << "\"walletLocked\":\"" << escapeJson(rows[i][10]) << "\"}";
                    cout << "OK|" << js.str();
                }
                return 0;
            }
        }
        cout << "ERR|Invalid credentials"; return 1;
    }

    // ── REGISTER ──────────────────────────────────────────────────────────
    if (command == "register") {
        if (argc < 10) { cout << "ERR|Usage: register <role> <name> <email> <password> <phone> <address> <cnic> <initialWallet>"; return 1; }
        const string role = argv[2], name = argv[3], email = argv[4];
        const string phone = argv[6], address = argv[7], cnic = argv[8];
        const string initialWallet = argv[9];

        auto rows = readCsvRows(usersFile);
        for (size_t i = 1; i < rows.size(); ++i) {
            if (rows[i].size() > 2 && rows[i][2] == email) {
                cout << "ERR|Email already registered"; return 1;
            }
        }
        auto registryRows = readCsvRows(registryFile);
        bool cnicFound = false;
        for (size_t i = 1; i < registryRows.size(); ++i) {
            if (registryRows[i].size() > 2 && registryRows[i][2] == cnic) { cnicFound = true; break; }
        }
        if (!cnicFound) { cout << "ERR|CNIC not found in govt registry"; return 1; }

        const string userId = nextUserId(rows, role);
        ofstream out(usersFile.c_str(), ios::app);
        if (!out.is_open()) { cout << "ERR|Cannot open users.csv"; return 1; }
        // schema: user_id,name,email,password,role,cnic,phone,address,trust_score,wallet_available,wallet_locked
        out << "\n" << userId << "," << name << "," << email << "," << argv[5] << ","
            << role << "," << cnic << "," << phone << "," << address << ",3.0," << initialWallet << ",0";
        out.close();
        {
            stringstream js;
            js << "{\"id\":\"" << escapeJson(userId) << "\",";
            js << "\"name\":\"" << escapeJson(name) << "\",";
            js << "\"email\":\"" << escapeJson(email) << "\",";
            js << "\"role\":\"" << escapeJson(role) << "\",";
            js << "\"cnic\":\"" << escapeJson(cnic) << "\",";
            js << "\"trustScore\":\"3.0\",";
            js << "\"walletAvailable\":\"" << escapeJson(initialWallet) << "\",";
            js << "\"walletLocked\":\"0\"}";
            cout << "OK|" << js.str();
        }
        return 0;
    }

    // ── CREATE_BOOKING ────────────────────────────────────────────────────
    // FIXED: correct CSV column order matching bookings.csv header
    if (command == "create_booking") {
        if (argc < 9) { cout << "ERR|Usage: create_booking <customerID> <vehicleID> <ownerID> <duration> <cost> <insurance> <deposit> [rentDate]"; return 1; }
        const string customerID = argv[2];
        const string vehicleID  = argv[3];
        const string ownerID    = argv[4];
        const int    duration   = atoi(argv[5]);
        const double cost       = atof(argv[6]);
        const string insurance  = argv[7];
        const double deposit    = atof(argv[8]);
        const string rentDate   = (argc > 9 && string(argv[9]) != "") ? argv[9] : getTodayDate();

        // Load users and check RESTRICTED (trust_score < 2)
        auto users = readCsvRows(usersFile);
        bool userFound = false;
        for (size_t i = 1; i < users.size(); ++i) {
            if (users[i].empty() || users[i][0] != customerID) continue;
            userFound = true;
            // RESTRICTED check
            double trust = (users[i].size() > 8) ? atof(users[i][8].c_str()) : 3.0;
            if (trust < 2.0) {
                cout << "ERR|RESTRICTED: Trust Score (" << trust << ") too low to book. Account under review.";
                return 1;
            }
            // Wallet escrow lock
            double available = (users[i].size() > 9)  ? atof(users[i][9].c_str())  : 0.0;
            double locked    = (users[i].size() > 10) ? atof(users[i][10].c_str()) : 0.0;
            Wallet wallet(available, locked);
            try {
                wallet.lock(deposit);
                stringstream ssA, ssL;
                ssA << fixed << setprecision(2) << wallet.getAvailableBalance();
                ssL << fixed << setprecision(2) << wallet.getLockedBalance();
                users[i][9]  = ssA.str();
                users[i][10] = ssL.str();
            } catch (const InsufficientFundsException& e) {
                cout << "ERR|" << e.what(); return 1;
            }
            break;
        }
        if (!userFound) { cout << "ERR|Customer not found"; return 1; }
        writeCsvRows(usersFile, users);

        // Generate unique booking ID
        auto bookings = readCsvRows(bookingsFile);
        string bookingID = nextBookingId(bookings);

        // Build properly ordered row matching CSV header (33 cols)
        // bookingID,bookedVehicleID,bookedCustomerID,ownerID,rentDate,rentDuration,rentalCost,
        // insuranceType,securityDeposit,status,pickupVideoPath,returnVideoPath,customerChecklist,
        // ownerChecklist,dentDescription,customerRated,ownerRated,amountLocked,amountPaid,
        // paymentDueDate,paymentPaidDate,inspectionNotes,disputeReason,adminVerdictNotes,
        // customerRating,ownerRating,customerReview,ownerReview,createdAt,approvedAt,pickupAt,returnAt,completedAt
        vector<string> row = blankBookingRow(33);
        row[0]  = bookingID;
        row[1]  = vehicleID;
        row[2]  = customerID;
        row[3]  = ownerID;
        row[4]  = rentDate;
        row[5]  = to_string(duration);
        row[6]  = to_string(cost);
        row[7]  = insurance;
        row[8]  = to_string(deposit);
        row[9]  = "PendingApproval";
        row[17] = to_string(deposit); // amountLocked = deposit
        row[18] = "0";                // amountPaid
        row[28] = getISOTimestamp();  // createdAt

        ofstream bOut(bookingsFile.c_str(), ios::app);
        if (!bOut.is_open()) { cout << "ERR|Cannot open bookings.csv"; return 1; }
        for (size_t i = 0; i < row.size(); ++i)
            bOut << row[i] << (i == row.size()-1 ? "" : ",");
        bOut << "\n";
        bOut.close();

        {
            stringstream js;
            js << "{\"bookingID\":\"" << escapeJson(bookingID) << "\",";
            js << "\"status\":\"PendingApproval\"}";
            cout << "OK|" << js.str();
        }
        return 0;
    }

    // ── TOGGLE_FAVORITE ───────────────────────────────────────────────────
    if (command == "toggle_favorite") {
        if (argc < 4) { cout << "ERR|Usage: toggle_favorite <userID> <vehicleID>"; return 1; }
        const string userID = argv[2], vehicleID = argv[3];
        auto favs = readCsvRows(favoritesFile);
        bool found = false;
        for (auto it = favs.begin(); it != favs.end(); ++it) {
            if ((*it).size() >= 2 && (*it)[0] == userID && (*it)[1] == vehicleID) {
                favs.erase(it); found = true; break;
            }
        }
        if (!found) favs.push_back({userID, vehicleID, getISOTimestamp()});
        writeCsvRows(favoritesFile, favs);
        {
            // build JSON array of favorites for the user
            stringstream js;
            js << "[";
            bool first = true;
            for (const auto& row : favs) {
                if (row.size() >= 2 && row[0] == userID) {
                    if (!first) js << ",";
                    js << "\"" << escapeJson(row[1]) << "\"";
                    first = false;
                }
            }
            js << "]";
            cout << "OK|" << js.str();
        }
        return 0;
    }

    // ── GET_FAVORITES ─────────────────────────────────────────────────────
    if (command == "get_favorites") {
        if (argc < 3) { cout << "ERR|Usage: get_favorites <userID>"; return 1; }
        const string userID = argv[2];
        auto favs = readCsvRows(favoritesFile);
        {
            stringstream js;
            js << "[";
            bool first = true;
            for (const auto& row : favs) {
                if (row.size() >= 2 && row[0] == userID) {
                    if (!first) js << ",";
                    js << "\"" << escapeJson(row[1]) << "\"";
                    first = false;
                }
            }
            js << "]";
            cout << "OK|" << js.str();
        }
        return 0;
    }

    // ── APPROVE_BOOKING ───────────────────────────────────────────────────
    if (command == "approve_booking") {
        if (argc < 4) { cout << "ERR|Usage: approve_booking <bookingID> <ownerChecklist> [ownerID]"; return 1; }
        const string bookingID = argv[2];
        const string ownerChecklist = argv[3];
        const string ownerID = (argc > 4) ? argv[4] : "";

        auto bookings = readCsvRows(bookingsFile);
        for (size_t i = 1; i < bookings.size(); ++i) {
            if (bookings[i].empty() || bookings[i][0] != bookingID) continue;
            if (bookings[i].size() < 33) bookings[i].resize(33);
            string current = bookings[i][9];
            if (current != "PendingApproval") {
                cout << "ERR|Invalid status transition from " << current; return 1;
            }
            bookings[i][9]  = "Approved";
            bookings[i][13] = ownerChecklist;   // ownerChecklist col
            bookings[i][29] = getISOTimestamp(); // approvedAt col
            if (!ownerID.empty()) bookings[i][3] = ownerID;
            writeCsvRows(bookingsFile, bookings);
            {
                stringstream js;
                js << "{\"bookingID\":\"" << escapeJson(bookingID) << "\",";
                js << "\"status\":\"Approved\"}";
                cout << "OK|" << js.str();
            }
            return 0;
        }
        cout << "ERR|Booking not found"; return 1;
    }

    // ── COMPLETE_PICKUP ───────────────────────────────────────────────────
    if (command == "complete_pickup") {
        if (argc < 4) { cout << "ERR|Usage: complete_pickup <bookingID> <pickupVideoPath> [customerID]"; return 1; }
        const string bookingID   = argv[2];
        const string pickupVideo = argv[3];

        auto bookings = readCsvRows(bookingsFile);
        for (size_t i = 1; i < bookings.size(); ++i) {
            if (bookings[i].empty() || bookings[i][0] != bookingID) continue;
            if (bookings[i].size() < 33) bookings[i].resize(33);
            string current = bookings[i][9];
            if (current != "Approved") {
                cout << "ERR|Invalid status transition from " << current; return 1;
            }
            bookings[i][9]  = "PickupCompleted";
            bookings[i][10] = pickupVideo;
            bookings[i][30] = getISOTimestamp(); // pickupAt
            writeCsvRows(bookingsFile, bookings);
            {
                stringstream js;
                js << "{\"bookingID\":\"" << escapeJson(bookingID) << "\",";
                js << "\"status\":\"PickupCompleted\"}";
                cout << "OK|" << js.str();
            }
            return 0;
        }
        cout << "ERR|Booking not found"; return 1;
    }

    // ── ACTIVATE_BOOKING (NEW: PickupCompleted → Active) ──────────────────
    if (command == "activate_booking") {
        if (argc < 3) { cout << "ERR|Usage: activate_booking <bookingID>"; return 1; }
        const string bookingID = argv[2];
        auto bookings = readCsvRows(bookingsFile);
        for (size_t i = 1; i < bookings.size(); ++i) {
            if (bookings[i].empty() || bookings[i][0] != bookingID) continue;
            if (bookings[i].size() < 33) bookings[i].resize(33);
            string current = bookings[i][9];
            if (current != "PickupCompleted") {
                cout << "ERR|Invalid status transition from " << current; return 1;
            }
            bookings[i][9] = "Active";
            writeCsvRows(bookingsFile, bookings);
            {
                stringstream js;
                js << "{\"bookingID\":\"" << escapeJson(bookingID) << "\",";
                js << "\"status\":\"Active\"}";
                cout << "OK|" << js.str();
            }
            return 0;
        }
        cout << "ERR|Booking not found"; return 1;
    }

    // ── COMPLETE_RETURN ───────────────────────────────────────────────────
    // FIXED: mismatch detection uses structured JSON key comparison
    if (command == "complete_return") {
        if (argc < 5) { cout << "ERR|Usage: complete_return <bookingID> <returnVideoPath> <customerChecklist> [customerID]"; return 1; }
        const string bookingID        = argv[2];
        const string returnVideo      = argv[3];
        const string customerChecklist= argv[4];

        auto bookings = readCsvRows(bookingsFile);
        for (size_t i = 1; i < bookings.size(); ++i) {
            if (bookings[i].empty() || bookings[i][0] != bookingID) continue;
            if (bookings[i].size() < 33) bookings[i].resize(33);
            string current = bookings[i][9];
            if (current != "Active") {
                cout << "ERR|Invalid status transition from " << current; return 1;
            }
            bookings[i][9]  = "ReturnCompleted";
            bookings[i][11] = returnVideo;
            bookings[i][12] = customerChecklist;
            bookings[i][31] = getISOTimestamp(); // returnAt

            // Missing video → LOW_TRUST flag but do NOT auto-dispute
            string pickupVideo = bookings[i][10];
            if (returnVideo.empty()) {
                bookings[i][22] = "LOW_TRUST:MISSING_RETURN_VIDEO";
            } else if (pickupVideo.empty()) {
                bookings[i][22] = "LOW_TRUST:MISSING_PICKUP_VIDEO";
            }

            // Checklist mismatch detection (structured key comparison)
            string ownerCL = bookings[i][13];
            bool mismatch = false;
            if (!ownerCL.empty() && !customerChecklist.empty()) {
                // Simple key-presence diff: count true/false occurrences
                // For JSON strings, compare normalized versions
                string normOwner = ownerCL, normCustomer = customerChecklist;
                normOwner.erase(remove(normOwner.begin(), normOwner.end(), ' '), normOwner.end());
                normCustomer.erase(remove(normCustomer.begin(), normCustomer.end(), ' '), normCustomer.end());
                if (normOwner != normCustomer) mismatch = true;
            }
                if (mismatch) {
                bookings[i][9]  = "Disputed";
                bookings[i][22] = "YELLOW_FLAG:CHECKLIST_MISMATCH";
                writeCsvRows(bookingsFile, bookings);
                {
                    stringstream js;
                    js << "{\"bookingID\":\"" << escapeJson(bookingID) << "\",";
                    js << "\"status\":\"Disputed\",";
                    js << "\"reason\":\"CHECKLIST_MISMATCH\"}";
                    cout << "OK|" << js.str();
                }
                return 0;
            }

            writeCsvRows(bookingsFile, bookings);
            {
                stringstream js;
                js << "{\"bookingID\":\"" << escapeJson(bookingID) << "\",";
                js << "\"status\":\"ReturnCompleted\"}";
                cout << "OK|" << js.str();
            }
            return 0;
        }
        cout << "ERR|Booking not found"; return 1;
    }

    // ── INSPECT_BOOKING ───────────────────────────────────────────────────
    // FIXED: paymentPaidDate set on completion, correct resize guard
    if (command == "inspect_booking") {
        if (argc < 4) { cout << "ERR|Usage: inspect_booking <bookingID> <approved:true|false> [notes] [adminID]"; return 1; }
        const string bookingID = argv[2];
        const string approved  = argv[3];
        const string notes     = (argc > 4) ? argv[4] : "";

        auto bookings = readCsvRows(bookingsFile);
        auto users    = readCsvRows(usersFile);
        for (size_t i = 1; i < bookings.size(); ++i) {
            if (bookings[i].empty() || bookings[i][0] != bookingID) continue;
            if (bookings[i].size() < 33) bookings[i].resize(33);
            string current = bookings[i][9];
            if (!(current == "ReturnCompleted" || current == "PendingInspection" || current == "Disputed")) {
                cout << "ERR|Invalid status to inspect: " << current; return 1;
            }

            double rentalCost = 0.0, deposit = 0.0;
            try { rentalCost = stod(bookings[i][6]); } catch(...) {}
            try { deposit    = stod(bookings[i][8]); } catch(...) {}
            const string ownerID    = bookings[i][3];
            const string customerID = bookings[i][2];

            if (approved == "true") {
                bookings[i][9]  = "Completed";
                bookings[i][21] = notes;           // inspectionNotes
                bookings[i][17] = "0";             // amountLocked cleared
                bookings[i][18] = to_string(rentalCost); // amountPaid
                bookings[i][20] = getISOTimestamp(); // paymentPaidDate (FIXED)
                bookings[i][32] = getISOTimestamp(); // completedAt (FIXED)

                // Release customer escrow deposit + pay owner rental cost
                for (size_t u = 1; u < users.size(); ++u) {
                    if (users[u].empty()) continue;
                    if (users[u].size() < 11) users[u].resize(11);
                    if (users[u][0] == customerID) {
                        double avail = 0, locked = 0;
                        try { avail  = stod(users[u][9]); }  catch(...) {}
                        try { locked = stod(users[u][10]); } catch(...) {}
                        locked = max(0.0, locked - deposit);
                        avail  += deposit;
                        users[u][9]  = to_string(avail);
                        users[u][10] = to_string(locked);
                    }
                    if (users[u][0] == ownerID) {
                        double avail = 0;
                        try { avail = stod(users[u][9]); } catch(...) {}
                        avail += rentalCost;
                        users[u][9] = to_string(avail);
                    }
                }
                writeCsvRows(usersFile, users);
                writeCsvRows(bookingsFile, bookings);
                {
                    stringstream js;
                    js << "{\"bookingID\":\"" << escapeJson(bookingID) << "\",";
                    js << "\"status\":\"Completed\"}";
                    cout << "OK|" << js.str();
                }
                return 0;
            } else {
                // Flag as Disputed for admin resolution
                bookings[i][9]  = "Disputed";
                bookings[i][21] = notes;
                writeCsvRows(bookingsFile, bookings);
                {
                    stringstream js;
                    js << "{\"bookingID\":\"" << escapeJson(bookingID) << "\",";
                    js << "\"status\":\"Disputed\"}";
                    cout << "OK|" << js.str();
                }
                return 0;
            }
        }
        cout << "ERR|Booking not found"; return 1;
    }

    // ── RESOLVE_DISPUTE ───────────────────────────────────────────────────
    if (command == "resolve_dispute") {
        if (argc < 4) { cout << "ERR|Usage: resolve_dispute <bookingID> <verdict:ResolvedFavorOwner|ResolvedFavorRenter> [notes]"; return 1; }
        const string bookingID = argv[2];
        const string verdict   = argv[3];
        const string notes     = (argc > 4) ? argv[4] : "";

        auto bookings = readCsvRows(bookingsFile);
        auto users    = readCsvRows(usersFile);
        for (size_t i = 1; i < bookings.size(); ++i) {
            if (bookings[i].empty() || bookings[i][0] != bookingID) continue;
            if (bookings[i].size() < 33) bookings[i].resize(33);
            
            const string customerID = bookings[i][2];
            const string ownerID    = bookings[i][3];
            double deposit = 0.0;
            try { deposit = stod(bookings[i][8]); } catch(...) {}

            bookings[i][9]  = verdict;
            bookings[i][23] = notes;             // adminVerdictNotes
            bookings[i][32] = getISOTimestamp(); // completedAt
            bookings[i][17] = "0";               // amountLocked cleared

            if (verdict == "ResolvedFavorRenter") {
                // Return deposit to customer
                for (size_t u = 1; u < users.size(); ++u) {
                    if (users[u].empty() || users[u][0] != customerID) continue;
                    if (users[u].size() < 11) users[u].resize(11);
                    double avail = 0, locked = 0;
                    try { avail = stod(users[u][9]); } catch(...) {}
                    try { locked = stod(users[u][10]); } catch(...) {}
                    locked = max(0.0, locked - deposit);
                    avail += deposit;
                    users[u][9] = to_string(avail);
                    users[u][10] = to_string(locked);
                    break;
                }
            } else if (verdict == "ResolvedFavorOwner") {
                // Deduct deposit from customer (it stays "cut") and optionally give to owner
                for (size_t u = 1; u < users.size(); ++u) {
                    if (users[u].empty()) continue;
                    if (users[u].size() < 11) users[u].resize(11);
                    if (users[u][0] == customerID) {
                        double locked = 0;
                        try { locked = stod(users[u][10]); } catch(...) {}
                        locked = max(0.0, locked - deposit);
                        users[u][10] = to_string(locked);
                    }
                    if (users[u][0] == ownerID) {
                        double avail = 0;
                        try { avail = stod(users[u][9]); } catch(...) {}
                        avail += deposit; // Transfer deposit to owner as compensation
                        users[u][9] = to_string(avail);
                    }
                }
            }

            writeCsvRows(usersFile, users);
            writeCsvRows(bookingsFile, bookings);
            {
                stringstream js;
                js << "{\"bookingID\":\"" << escapeJson(bookingID) << "\",";
                js << "\"status\":\"" << escapeJson(verdict) << "\"}";
                cout << "OK|" << js.str();
            }
            return 0;
        }
        cout << "ERR|Booking not found"; return 1;
    }

    // ── VERIFY_VEHICLE ────────────────────────────────────────────────────
    if (command == "verify_vehicle") {
        if (argc < 4) { cout << "ERR|Usage: verify_vehicle <vehicleNumber> <ownerCnic>"; return 1; }
        const bool ok = VerificationEngine::verify(argv[2], argv[3], registryFile);
        cout << (ok ? "OK|VERIFIED" : "ERR|NOT_FOUND");
        return ok ? 0 : 1;
    }

    cout << "ERR|Unknown command: " << command;
    return 1;
}
