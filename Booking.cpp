#include <cctype>
#include <conio.h>
#include <cstdlib>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#include "Booking.h"
#include "Common.h"
using namespace std;

/* Define Status Constants */
const string Booking::STATUS_PENDING_APPROVAL = "PendingApproval";
const string Booking::STATUS_APPROVED = "Approved";
const string Booking::STATUS_PICKUP_SCHEDULED = "PickupScheduled";
const string Booking::STATUS_PICKUP_COMPLETED = "PickupCompleted";
const string Booking::STATUS_ACTIVE = "Active";
const string Booking::STATUS_RETURN_SCHEDULED = "ReturnScheduled";
const string Booking::STATUS_RETURN_COMPLETED = "ReturnCompleted";
const string Booking::STATUS_PENDING_INSPECTION = "PendingInspection";
const string Booking::STATUS_COMPLETED = "Completed";
const string Booking::STATUS_DISPUTED = "Disputed";
const string Booking::STATUS_RESOLVED_FAVOR_OWNER = "ResolvedFavorOwner";
const string Booking::STATUS_RESOLVED_FAVOR_RENTER = "ResolvedFavorRenter";

Booking::Booking()
    : bookedVehicleID(""), bookedCustomerID(""), ownerID(""), rentDuration(0),
      rentalCost(0.0), insuranceType("Basic"), securityDeposit(0.0),
      status(STATUS_PENDING_APPROVAL), pickupVideoPath(""), returnVideoPath(""),
      customerChecklist(""), ownerChecklist(""), dentDescription(""),
      customerRated(false), ownerRated(false), amountLocked(0.0), amountPaid(0.0),
      paymentDueDate(""), paymentPaidDate(""), inspectionNotes(""),
      disputeReason(""), adminVerdictNotes(""), customerRating(0.0),
      ownerRating(0.0), customerReview(""), ownerReview("") {
  bookingsCount++;
  bookingIDCounter++;
  generateBookingID();
  setRentDateToToday();
  setCreatedAt(rentDate);
}

Booking::Booking(const string &vID, const string &cID, int days,
                 double rentPerDay)
    : bookedVehicleID(vID), bookedCustomerID(cID), ownerID(""),
      rentDuration(days), insuranceType("Basic"), securityDeposit(0.0),
      status(STATUS_PENDING_APPROVAL), pickupVideoPath(""), returnVideoPath(""),
      customerChecklist(""), ownerChecklist(""), dentDescription(""),
      customerRated(false), ownerRated(false), amountLocked(0.0), amountPaid(0.0),
      paymentDueDate(""), paymentPaidDate(""), inspectionNotes(""),
      disputeReason(""), adminVerdictNotes(""), customerRating(0.0),
      ownerRating(0.0), customerReview(""), ownerReview("") {
  bookingsCount++;
  bookingIDCounter++;
  generateBookingID();
  setRentDateToToday();
  rentalCost = rentDuration * rentPerDay;
  setCreatedAt(rentDate);
}

void Booking::generateBookingID() {
  stringstream ss;
  ss << "B-" << setw(4) << setfill('0') << bookingIDCounter;
  bookingID = ss.str();
}

void Booking::incrementOrDecrementIDCounter(bool isIncrement) {
  (isIncrement) ? bookingIDCounter++ : bookingIDCounter--;
}

/* Status Transition Validation */
bool Booking::isValidStatusTransition(const string &newStatus) const {
  if (status == newStatus) return false;  // No-op transition
  
  // Valid transitions from each status
  if (status == STATUS_PENDING_APPROVAL) {
    return newStatus == STATUS_APPROVED || newStatus == STATUS_DISPUTED;
  }
  if (status == STATUS_APPROVED) {
    return newStatus == STATUS_PICKUP_SCHEDULED;
  }
  if (status == STATUS_PICKUP_SCHEDULED) {
    return newStatus == STATUS_PICKUP_COMPLETED;
  }
  if (status == STATUS_PICKUP_COMPLETED) {
    return newStatus == STATUS_ACTIVE;
  }
  if (status == STATUS_ACTIVE) {
    return newStatus == STATUS_RETURN_SCHEDULED || newStatus == STATUS_DISPUTED;
  }
  if (status == STATUS_RETURN_SCHEDULED) {
    return newStatus == STATUS_RETURN_COMPLETED;
  }
  if (status == STATUS_RETURN_COMPLETED) {
    return newStatus == STATUS_PENDING_INSPECTION;
  }
  if (status == STATUS_PENDING_INSPECTION) {
    return newStatus == STATUS_COMPLETED || newStatus == STATUS_DISPUTED;
  }
  if (status == STATUS_DISPUTED) {
    return newStatus == STATUS_RESOLVED_FAVOR_OWNER || 
           newStatus == STATUS_RESOLVED_FAVOR_RENTER;
  }
  
  return false;  // Invalid transition
}

bool Booking::canApprove() const {
  return status == STATUS_PENDING_APPROVAL;
}

bool Booking::canPickup() const {
  return status == STATUS_APPROVED;
}

bool Booking::canReturn() const {
  return status == STATUS_ACTIVE;
}

bool Booking::canCompleteInspection() const {
  return status == STATUS_PENDING_INSPECTION;
}

bool Booking::canRate() const {
  return status == STATUS_COMPLETED || 
         status == STATUS_RESOLVED_FAVOR_OWNER ||
         status == STATUS_RESOLVED_FAVOR_RENTER;
}

void Booking::displayBookingDetails() const {
  printFormattedText("Booking ID: " + bookingID + " | Vehicle: " +
                         bookedVehicleID + " | Renter: " + bookedCustomerID,
                     COLOR_WHITE, false);
  printFormattedText("Rent Date: " + rentDate +
                         " | Duration: " + to_string(rentDuration) + " days" +
                         " | Cost: $" + toTwoDecimalString(rentalCost),
                     COLOR_WHITE, false);
  printFormattedText("Insurance: " + insuranceType + " | Deposit: $" +
                         toTwoDecimalString(securityDeposit) +
                         " | Status: " + status,
                     COLOR_CYAN, false);
  if (!ownerID.empty())
    printFormattedText("Owner: " + ownerID, COLOR_WHITE, false);
  if (!pickupVideoPath.empty())
    printFormattedText("Pickup Video: " + pickupVideoPath, COLOR_WHITE, false);
  if (!returnVideoPath.empty())
    printFormattedText("Return Video: " + returnVideoPath, COLOR_WHITE, false);
  printLineWithSpaces();
}

/* Setters */
void Booking::setBookingID(const string &id) { bookingID = id; }
void Booking::setBookedVehicleID(const string &vID) { bookedVehicleID = vID; }
void Booking::setBookedCustomerID(const string &cID) { bookedCustomerID = cID; }
void Booking::setOwnerID(const string &oID) { ownerID = oID; }
void Booking::setRentDate(const string &date) { rentDate = date; }

void Booking::setRentDateToToday() {
  time_t now = time(0);
  tm *currentDate = localtime(&now);

  stringstream ss;
  ss << setfill('0') << setw(2) << currentDate->tm_mday << "-" << setfill('0')
     << setw(2) << (currentDate->tm_mon + 1) << "-"
     << (1900 + currentDate->tm_year);

  rentDate = ss.str();
}

void Booking::setRentDuration(int days) { rentDuration = days; }
void Booking::setRentalCost(double cost) { rentalCost = cost; }
void Booking::setInsuranceType(const string &type) { insuranceType = type; }
void Booking::setSecurityDeposit(double deposit) { securityDeposit = deposit; }
void Booking::setStatus(const string &s) { status = s; }
void Booking::setPickupVideoPath(const string &path) { pickupVideoPath = path; }
void Booking::setReturnVideoPath(const string &path) { returnVideoPath = path; }
void Booking::setCustomerChecklist(const string &cl) { customerChecklist = cl; }
void Booking::setOwnerChecklist(const string &cl) { ownerChecklist = cl; }
void Booking::setDentDescription(const string &desc) { dentDescription = desc; }
void Booking::setCustomerRated(bool rated) { customerRated = rated; }
void Booking::setOwnerRated(bool rated) { ownerRated = rated; }
void Booking::setAmountLocked(double amount) { amountLocked = amount; }
void Booking::setAmountPaid(double amount) { amountPaid = amount; }
void Booking::setPaymentDueDate(const string &date) { paymentDueDate = date; }
void Booking::setPaymentPaidDate(const string &date) { paymentPaidDate = date; }
void Booking::setInspectionNotes(const string &notes) { inspectionNotes = notes; }
void Booking::setDisputeReason(const string &reason) { disputeReason = reason; }
void Booking::setAdminVerdictNotes(const string &notes) { adminVerdictNotes = notes; }
void Booking::setCustomerRating(double rating) { customerRating = rating; }
void Booking::setOwnerRating(double rating) { ownerRating = rating; }
void Booking::setCustomerReview(const string &review) { customerReview = review; }
void Booking::setOwnerReview(const string &review) { ownerReview = review; }
void Booking::setCreatedAt(const string &date) { createdAt = date; }
void Booking::setApprovedAt(const string &date) { approvedAt = date; }
void Booking::setPickupAt(const string &date) { pickupAt = date; }
void Booking::setReturnAt(const string &date) { returnAt = date; }
void Booking::setCompletedAt(const string &date) { completedAt = date; }
void Booking::setIDCounter(int count) { bookingIDCounter = count; }

/* Getters */
string Booking::getBookingID() const { return bookingID; }
string Booking::getBookedVehicleID() const { return bookedVehicleID; }
string Booking::getBookedCustomerID() const { return bookedCustomerID; }
string Booking::getOwnerID() const { return ownerID; }
string Booking::getRentDate() const { return rentDate; }
int Booking::getRentDuration() const { return rentDuration; }
double Booking::getRentalCost() const { return rentalCost; }
string Booking::getInsuranceType() const { return insuranceType; }
double Booking::getSecurityDeposit() const { return securityDeposit; }
string Booking::getStatus() const { return status; }
string Booking::getPickupVideoPath() const { return pickupVideoPath; }
string Booking::getReturnVideoPath() const { return returnVideoPath; }
string Booking::getCustomerChecklist() const { return customerChecklist; }
string Booking::getOwnerChecklist() const { return ownerChecklist; }
string Booking::getDentDescription() const { return dentDescription; }
bool Booking::hasCustomerRated() const { return customerRated; }
bool Booking::hasOwnerRated() const { return ownerRated; }
double Booking::getAmountLocked() const { return amountLocked; }
double Booking::getAmountPaid() const { return amountPaid; }
string Booking::getPaymentDueDate() const { return paymentDueDate; }
string Booking::getPaymentPaidDate() const { return paymentPaidDate; }
string Booking::getInspectionNotes() const { return inspectionNotes; }
string Booking::getDisputeReason() const { return disputeReason; }
string Booking::getAdminVerdictNotes() const { return adminVerdictNotes; }
double Booking::getCustomerRating() const { return customerRating; }
double Booking::getOwnerRating() const { return ownerRating; }
string Booking::getCustomerReview() const { return customerReview; }
string Booking::getOwnerReview() const { return ownerReview; }
string Booking::getCreatedAt() const { return createdAt; }
string Booking::getApprovedAt() const { return approvedAt; }
string Booking::getPickupAt() const { return pickupAt; }
string Booking::getReturnAt() const { return returnAt; }
string Booking::getCompletedAt() const { return completedAt; }
int Booking::getBookingsCount() { return bookingsCount; }

Booking::~Booking() { bookingsCount--; }

int Booking::bookingsCount = 0;
int Booking::bookingIDCounter = 0;