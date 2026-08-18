class PenaltyCalculator {

  calculateLateReturn(expectedEndDate, actualReturnDate, penaltyRatePerHour = 100.00) {
    const expectedTime = new Date(expectedEndDate).getTime();
    const actualTime = new Date(actualReturnDate).getTime();
    
    if (actualTime <= expectedTime) {
      return { hoursOverdue: 0, penaltyAmount: 0 };
    }
    
    // Difference in milliseconds converted to hours (rounded up to nearest hour)
    const diffMs = actualTime - expectedTime;
    const hoursOverdue = Math.ceil(diffMs / (1000 * 60 * 60));
    const penaltyAmount = parseFloat((hoursOverdue * penaltyRatePerHour).toFixed(2));
    
    return { hoursOverdue, penaltyAmount };
  }


  calculateAllPenalties(returnDetails, plan = {}) {
    const penalties = [];
    const penaltyPerHour = plan.late_return_penalty_per_hour ? parseFloat(plan.late_return_penalty_per_hour) : 100.00;

    // 1. Late Return Penalty
    if (returnDetails.expectedEndDate && returnDetails.actualReturnDate) {
      const lateResult = this.calculateLateReturn(
        returnDetails.expectedEndDate, 
        returnDetails.actualReturnDate, 
        penaltyPerHour
      );
      if (lateResult.penaltyAmount > 0) {
        penalties.push({
          type: 'LATE_RETURN',
          amount: lateResult.penaltyAmount,
          description: `Late return by ${lateResult.hoursOverdue} hour(s) charged at rate ${penaltyPerHour}/hour`
        });
      }
    }

    // 2. Damage Penalty
    if (returnDetails.damageCost && parseFloat(returnDetails.damageCost) > 0) {
      penalties.push({
        type: 'DAMAGE',
        amount: parseFloat(returnDetails.damageCost),
        description: returnDetails.damageDescription || 'Vehicle body/component damage charges'
      });
    }

    // 3. Cleaning Charges
    if (returnDetails.cleaningCost && parseFloat(returnDetails.cleaningCost) > 0) {
      penalties.push({
        type: 'CLEANING',
        amount: parseFloat(returnDetails.cleaningCost),
        description: 'Vehicle cleaning and detritus removal charges'
      });
    }

    // 4. Missing Accessories (helmet, mirrors, key, etc.)
    if (returnDetails.missingAccessoriesCost && parseFloat(returnDetails.missingAccessoriesCost) > 0) {
      penalties.push({
        type: 'MISSING_ACCESSORIES',
        amount: parseFloat(returnDetails.missingAccessoriesCost),
        description: returnDetails.missingAccessoriesDescription || 'Charges for missing helmet/mirrors/key'
      });
    }

    // 5. Fuel Shortage Charges
    if (returnDetails.fuelShortageCost && parseFloat(returnDetails.fuelShortageCost) > 0) {
      penalties.push({
        type: 'FUEL_SHORTAGE',
        amount: parseFloat(returnDetails.fuelShortageCost),
        description: 'Fuel replenishment cost'
      });
    }

    // 6. Battery Issues
    if (returnDetails.batteryIssueCost && parseFloat(returnDetails.batteryIssueCost) > 0) {
      penalties.push({
        type: 'BATTERY_ISSUE',
        amount: parseFloat(returnDetails.batteryIssueCost),
        description: 'Battery damage or capacity reduction charges'
      });
    }

    // 7. Policy Violations
    if (returnDetails.policyViolationCost && parseFloat(returnDetails.policyViolationCost) > 0) {
      penalties.push({
        type: 'POLICY_VIOLATION',
        amount: parseFloat(returnDetails.policyViolationCost),
        description: returnDetails.policyViolationDescription || 'Over-speeding, border crossing, or authorization violation'
      });
    }

    return penalties;
  }
}

module.exports = new PenaltyCalculator();
