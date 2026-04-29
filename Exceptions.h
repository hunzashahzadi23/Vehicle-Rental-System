#ifndef EXCEPTIONS_H
#define EXCEPTIONS_H

#include <string>
#include <exception>

/**
 * Custom Exception Hierarchy for the Rental System.
 * Demonstrates advanced OOP error handling.
 */
class RentalException : public std::exception {
protected:
    std::string message;
public:
    RentalException(const std::string& msg) : message(msg) {}
    virtual const char* what() const noexcept override {
        return message.c_str();
    }
};

class InsufficientFundsException : public RentalException {
public:
    InsufficientFundsException(const std::string& msg) : RentalException("FUNDING ERROR: " + msg) {}
};

class VehicleUnavailableException : public RentalException {
public:
    VehicleUnavailableException(const std::string& msg) : RentalException("AVAILABILITY ERROR: " + msg) {}
};

class AuthenticationException : public RentalException {
public:
    AuthenticationException(const std::string& msg) : RentalException("AUTH ERROR: " + msg) {}
};

#endif
