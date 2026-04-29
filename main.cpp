#include <iostream>
#include <string>
#include <vector>
#include <conio.h>
#include <cstdlib>
#include <chrono>
#include <thread>

#include "SystemManager.h"
#include "Common.h"
#include "Exceptions.h"

using namespace std;

void showStartupSequence();
void registerOrLogin(const string &userType);
void loginUser(const string &userType);
void registerUser(const string &userType);

int main()
{
    /* ── OOP PILLARS DEMO ── */
    /* ENCAPSULATION: All data in objects is accessed via protected/private members and getters/setters. */
    /* INHERITANCE: Car, Bike, Truck inherit from Vehicle; Customer, Lessor, Admin from User. */
    /* ABSTRACTION: User and Vehicle are abstract classes with pure virtual methods. */
    /* POLYMORPHISM: Virtual functions, dynamic_cast, and Operator Overloading (<<, ==, +=, >). */
    /* DESIGN PATTERNS: Singleton (SystemManager). */

    showStartupSequence();

    string options[4] = {"Admin Portal", "Customer Marketplace", "Lessor Dashboard", "Exit System"};
    int choice = 0, maxChoices = 3;
    bool exitStatus = false;
    char pressedKey;

    do
    {
        system("cls");
        printProjectTitle();
        printLineWithDashes();
        printFormattedText("Karwan - Enterprise Vehicle Management", COLOR_CYAN, true);
        printLineWithDashes();

        for (int i = 0; i < 4; i++)
        {
            if(i == choice)
                printFormattedText(string(" ==> ") + to_string(i + 1) + ". " + options[i], COLOR_YELLOW, true);
            else
                printFormattedText(string("     ") + to_string(i + 1) + ". " + options[i], COLOR_WHITE, true);
        }

        printLineWithDashes();
        printFormattedText("Navigate: W/S | Confirm: ENTER", COLOR_WHITE, false);
        printLineWithDashes();

        pressedKey = _getch();
        if ((pressedKey == 'w' || pressedKey == 'W' || pressedKey == 72) && (choice > 0)) choice--;
        else if ((pressedKey == 's' || pressedKey == 'S'|| pressedKey == 80) && (choice < maxChoices)) choice++;
        else if (pressedKey == '\r')
        {
            switch (choice)
            {
            case 0: registerOrLogin("Admin"); break;
            case 1: registerOrLogin("Customer"); break;
            case 2: registerOrLogin("Lessor"); break;
            case 3: exitStatus = true; break;
            }
        }     
    } while (!exitStatus);
    
    printFormattedText("Shutting down Karwan Engine...", COLOR_RED, true);
    SystemManager::getInstance()->shutdown();
    
    return 0;
}

void showStartupSequence() {
    system("cls");
    printProjectTitle();
    printFormattedText("INITIALIZING SYSTEM CORE...", COLOR_GREEN, true);
    this_thread::sleep_for(chrono::milliseconds(500));
    printFormattedText("[OK] Memory Manager Singleton Active", COLOR_WHITE, false);
    this_thread::sleep_for(chrono::milliseconds(300));
    printFormattedText("[OK] Virtual Dispatch Table Loaded", COLOR_WHITE, false);
    this_thread::sleep_for(chrono::milliseconds(300));
    printFormattedText("[OK] Encapsulation Protocols Verified", COLOR_WHITE, false);
    this_thread::sleep_for(chrono::milliseconds(300));
    printFormattedText("SYSTEM READY.", COLOR_CYAN, true);
    this_thread::sleep_for(chrono::milliseconds(1000));
}

void registerOrLogin(const string &userType)
{
    string options[3] = {"Create New Account", "Sign In", "Navigate Back"};
    int choice = 0, maxChoices = 2;
    bool exitStatus = false;
    char pressedKey;

    do
    {
        system("cls");
        printLineWithDashes();
        printFormattedText(userType + " Portal", COLOR_BLUE, true);
        printLineWithDashes();

        for (int i = 0; i < 3; i++)
        {
            if(i == choice)
                printFormattedText(string("==> ") + to_string(i + 1) + ". " + options[i], COLOR_YELLOW, true);
            else
                printFormattedText(to_string(i + 1) + ". " + options[i], COLOR_WHITE, true);
        }

        pressedKey = _getch();
        if ((pressedKey == 'w' || pressedKey == 'W' || pressedKey == 72) && (choice > 0)) choice--;
        else if ((pressedKey == 's' || pressedKey == 'S'|| pressedKey == 80) && (choice < maxChoices)) choice++;
        else if (pressedKey == '\r')
        {
            switch (choice)
            {
            case 0: registerUser(userType); break;
            case 1: loginUser(userType); break;
            case 2: exitStatus = true; break;
            }
        }     
    } while (!exitStatus);
}

void loginUser(const string &userType)
{
    string enteredEmail, enteredPass;
    SystemManager* sys = SystemManager::getInstance();

    system("cls");
    printLineWithDashes();
    printFormattedText(userType + " Login", COLOR_BLUE, true);
    printLineWithDashes();

    printFormattedText("Enter Email Address:", COLOR_WHITE, false);
    printInputPrompt();
    getline(cin, enteredEmail);
    
    printFormattedText("Enter Password:", COLOR_WHITE, false);
    printInputPrompt();
    enteredPass = maskedPassword();
    cout << endl;

    User* user = sys->findUserByEmail(enteredEmail);
    
    if (user && user->getUserType() == userType && user->verifyLogin(enteredEmail, enteredPass))
    {
        printFormattedText("Login Successful!", COLOR_GREEN, true);

        if (userType == "Admin")
        {
            Admin* admin = dynamic_cast<Admin*>(user);
            if (admin) {
                // Prepare context
                vector<Customer*> customers;
                for (auto u : sys->getAllUsers()) {
                    if (u->getUserType() == "Customer") customers.push_back(dynamic_cast<Customer*>(u));
                }
                admin->setCustomersContext(&customers);
                
                vector<Vehicle*> inventory = sys->getInventory();
                admin->userConsole(inventory);
            }
        }
        else
        {
            vector<Vehicle*> inventory = sys->getInventory();
            user->userConsole(inventory);
        }
    }
    else
    {
        printFormattedText("Invalid Credentials!", COLOR_RED, true);
    }
}

void registerUser(const string &userType)
{
    User *newUser;
    SystemManager* sys = SystemManager::getInstance();
    
    system("cls");
    printLineWithDashes();
    printFormattedText(userType + " Registration", COLOR_BLUE, true);
    printLineWithDashes();

    if (userType == "Admin") newUser = new Admin();
    else if (userType == "Lessor") newUser = new Lessor();
    else newUser = new Customer();

    vector<User*> existingUsers = sys->getAllUsers();
    newUser->registerUser(existingUsers);

    sys->addUser(newUser);

    printFormattedText("Registration Successful! Welcome " + newUser->getUserName(), COLOR_GREEN, true);
    system("pause");
}
