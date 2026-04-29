#ifndef COMMON_H
#define COMMON_H

#include <iostream>
#include <string>
#include <vector>
#include <iomanip>
#include <algorithm>
#include <conio.h>

using namespace std;

/* Simple Color Codes for Console (ANSI) */
#define COLOR_RESET   "\033[0m"
#define COLOR_RED     "\033[31m"
#define COLOR_GREEN   "\033[32m"
#define COLOR_YELLOW  "\033[33m"
#define COLOR_BLUE    "\033[34m"
#define COLOR_MAGENTA "\033[35m"
#define COLOR_CYAN    "\033[36m"
#define COLOR_WHITE   "\033[37m"

/* Simplified Print Helpers to replace TerminalControl */
inline void printLineWithDashes() {
    cout << "--------------------------------------------------------------------------------" << endl;
}

inline void printLineWithSpaces() {
    cout << endl;
}

inline void printFormattedText(const string& text, const char* color, bool centered) {
    if (centered) {
        int padding = (80 - (int)text.length()) / 2;
        if (padding > 0) cout << string(padding, ' ');
    }
    cout << color << text << COLOR_RESET << endl;
}

inline void printInputPrompt() {
    cout << COLOR_YELLOW << " >> " << COLOR_RESET;
}

inline string lowercaseString(string s) {
    transform(s.begin(), s.end(), s.begin(), ::tolower);
    return s;
}

inline string toTwoDecimalString(double val) {
    stringstream ss;
    ss << fixed << setprecision(2) << val;
    return ss.str();
}

inline bool isEmailValid(const string& email) {
    return email.find('@') != string::npos && email.find('.') != string::npos;
}

inline void printProjectTitle() {
    cout << COLOR_CYAN << "==========================================================" << endl;
    cout << "                    KARWAN - VEHICLE RENTAL               " << endl;
    cout << "==========================================================" << COLOR_RESET << endl;
}

inline void maskCursor() {
    // No-op for standard console
}

inline string maskedPassword() {
    string pass = "";
    char ch;
    while ((ch = _getch()) != '\r') {
        if (ch == '\b') {
            if (pass.length() > 0) {
                pass.pop_back();
                cout << "\b \b";
            }
        } else {
            pass.push_back(ch);
            cout << '*';
        }
    }
    return pass;
}

#endif
