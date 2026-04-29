#ifndef VERIFICATIONENGINE_H
#define VERIFICATIONENGINE_H

#include <iostream>
#include <string>
#include <iostream>
#include <string>
using namespace std;

/**
 * VerificationEngine — Simulation of Vehicle Registry Verification.
 *
 * Verification is handled against CSV registry data maintained locally.
 * This keeps identity and ownership checks in the C++ backend domain.
 *
 * All methods are static — no instantiation needed.
 */
class VerificationEngine
{
public:
    /**
     * verify() — Check if a given license plate is registered to the given CNIC.
     * @param plate       License plate string (e.g., "ABC-123")
     * @param cnic        CNIC of the posting Lessor (e.g., "12345-6789012-3")
     * @param registryFile Path to gov_registry.csv
     * @return true if the plate-CNIC pair exists in the registry.
     */
    static bool verify(const string &plate, const string &cnic,
                       const string &registryFile = "gov_registry.csv");

    /**
     * isPlateInRegistry() — Check if a plate exists at all (regardless of CNIC).
     * Used for fraud detection (duplicate plate check).
     */
    static bool isPlateInRegistry(const string &plate,
                                  const string &registryFile = "gov_registry.csv");
};

#endif
