#ifndef BOOKING_H
#define BOOKING_H

#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <cctype>
#include <ctime>
#include <conio.h>
#include <cstdlib>


using namespace std;

/**
 * Booking — The "Contract" object between a Renter and a Vehicle Owner.
 *
 * Extended with: ownerID, insuranceType, securityDeposit, status,
 * and ConditionManifest (pickup/return video paths).
 * 
 * Status Flow: PendingApproval → Approved → PickupScheduled → PickupCompleted → 
 *             Active → ReturnScheduled → ReturnCompleted → PendingInspection → 
 *             Completed OR Disputed
 */
class Booking
{
public:
    /* Status Constants */
    static const string STATUS_PENDING_APPROVAL;      // Initial - awaiting owner approval
    static const string STATUS_APPROVED;              // Owner approved rental request
    static const string STATUS_PICKUP_SCHEDULED;      // Ready for pickup
    static const string STATUS_PICKUP_COMPLETED;      // Customer picked up + video uploaded
    static const string STATUS_ACTIVE;                // Customer has vehicle
    static const string STATUS_RETURN_SCHEDULED;      // Return date approaching
    static const string STATUS_RETURN_COMPLETED;      // Customer returned + video uploaded
    static const string STATUS_PENDING_INSPECTION;    // Awaiting owner/admin inspection
    static const string STATUS_COMPLETED;             // Successful completion
    static const string STATUS_DISPUTED;              // Dispute raised - awaiting admin verdict
    static const string STATUS_RESOLVED_FAVOR_OWNER;  // Dispute resolved in owner's favor
    static const string STATUS_RESOLVED_FAVOR_RENTER; // Dispute resolved in renter's favor

private:
    string bookingID;
    string bookedVehicleID;
    string bookedCustomerID;
    string ownerID;               // Lessor who owns the vehicle
    string rentDate;              // Requested rental date
    int rentDuration;
    double rentalCost;            // Total rental cost
    string insuranceType;         // "Basic" or "Premium"
    double securityDeposit;       // Escrow deposit amount
    string status;                // Current booking status
    
    /* Payment & Escrow Fields */
    double amountLocked;          // Amount locked in escrow
    double amountPaid;            // Amount paid to owner
    string paymentDueDate;        // When payment is due
    string paymentPaidDate;       // When payment was processed
    
    /* Condition & Documentation */
    string pickupVideoPath;       // Customer pickup proof video
    string returnVideoPath;       // Customer return proof video
    string customerChecklist;     // Condition checklist from customer at return
    string ownerChecklist;        // Condition checklist from owner at pickup
    string inspectionNotes;       // Admin/owner inspection notes
    
    /* Dispute & Resolution */
    string dentDescription;       // Description of issues/damages
    string disputeReason;         // Reason for dispute if raised
    string adminVerdictNotes;     // Admin verdict on dispute
    
    /* Ratings & Reviews */
    bool customerRated;           // Has customer rated?
    bool ownerRated;              // Has owner rated?
    double customerRating;        // Customer's rating of vehicle/owner (1-5)
    double ownerRating;           // Owner's rating of customer (1-5)
    string customerReview;        // Customer's review text
    string ownerReview;           // Owner's review text
    
    /* Timestamps */
    string createdAt;             // When booking was created
    string approvedAt;            // When owner approved
    string pickupAt;              // Pickup timestamp
    string returnAt;              // Return timestamp
    string completedAt;           // When booking was marked complete
    
    static int bookingsCount;
    static int bookingIDCounter;

public:
    /* Constructors */
    Booking();
    Booking(const string &vID, const string &cID, int days, double rentPerDay = 0.0);

    /* Utility Methods */
    void generateBookingID();
    void incrementOrDecrementIDCounter(bool isIncrement);
    void displayBookingDetails() const;

    /* Status Management */
    bool isValidStatusTransition(const string &newStatus) const;
    bool canApprove() const;
    bool canPickup() const;
    bool canReturn() const;
    bool canCompleteInspection() const;
    bool canRate() const;

    /* Setters */
    void setBookingID(const string &id);
    void setBookedVehicleID(const string &vID);
    void setBookedCustomerID(const string &cID);
    void setOwnerID(const string &oID);
    void setRentDate(const string &date);
    void setRentDateToToday();
    void setRentDuration(int days);
    void setRentalCost(double cost);
    void setInsuranceType(const string &type);
    void setSecurityDeposit(double deposit);
    void setStatus(const string &s);
    void setPickupVideoPath(const string &path);
    void setReturnVideoPath(const string &path);
    void setCustomerChecklist(const string &cl);
    void setOwnerChecklist(const string &cl);
    void setDentDescription(const string &desc);
    void setCustomerRated(bool rated);
    void setOwnerRated(bool rated);
    void setAmountLocked(double amount);
    void setAmountPaid(double amount);
    void setPaymentDueDate(const string &date);
    void setPaymentPaidDate(const string &date);
    void setInspectionNotes(const string &notes);
    void setDisputeReason(const string &reason);
    void setAdminVerdictNotes(const string &notes);
    void setCustomerRating(double rating);
    void setOwnerRating(double rating);
    void setCustomerReview(const string &review);
    void setOwnerReview(const string &review);
    void setCreatedAt(const string &date);
    void setApprovedAt(const string &date);
    void setPickupAt(const string &date);
    void setReturnAt(const string &date);
    void setCompletedAt(const string &date);
    static void setIDCounter(int count);

    /* Getters */
    string getBookingID() const;
    string getBookedVehicleID() const;
    string getBookedCustomerID() const;
    string getOwnerID() const;
    string getRentDate() const;
    int getRentDuration() const;
    double getRentalCost() const;
    string getInsuranceType() const;
    double getSecurityDeposit() const;
    string getStatus() const;
    string getPickupVideoPath() const;
    string getReturnVideoPath() const;
    string getCustomerChecklist() const;
    string getOwnerChecklist() const;
    string getDentDescription() const;
    bool hasCustomerRated() const;
    bool hasOwnerRated() const;
    double getAmountLocked() const;
    double getAmountPaid() const;
    string getPaymentDueDate() const;
    string getPaymentPaidDate() const;
    string getInspectionNotes() const;
    string getDisputeReason() const;
    string getAdminVerdictNotes() const;
    double getCustomerRating() const;
    double getOwnerRating() const;
    string getCustomerReview() const;
    string getOwnerReview() const;
    string getCreatedAt() const;
    string getApprovedAt() const;
    string getPickupAt() const;
    string getReturnAt() const;
    string getCompletedAt() const;
    static int getBookingsCount();

    /* Destructor */
    ~Booking();
};

#endif