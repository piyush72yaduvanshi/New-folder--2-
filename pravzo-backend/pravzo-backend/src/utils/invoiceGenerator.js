class InvoiceGenerator {

  generateBreakdown(rental, penalties = [], taxRate = 0.18) {
    const baseRate = parseFloat(rental.base_amount || 0);
    const depositAmount = parseFloat(rental.security_deposit || 0);
    const discount = parseFloat(rental.discount_amount || 0);

    // Sum up charges by type
    let extraTimeCharges = 0;
    let penaltyCharges = 0;
    let damageCharges = 0;
    let cleaningCharges = 0;

    penalties.forEach(p => {
      const amt = parseFloat(p.amount || 0);
      if (p.type === 'LATE_RETURN') {
        extraTimeCharges += amt;
      } else if (p.type === 'DAMAGE') {
        damageCharges += amt;
      } else if (p.type === 'CLEANING') {
        cleaningCharges += amt;
      } else {
        penaltyCharges += amt; // missing accessories, fuel shortage, battery, policy violation
      }
    });

    // Subtotal of taxable components
    const subtotalTaxable = baseRate + extraTimeCharges + penaltyCharges + damageCharges + cleaningCharges - discount;
    const finalSubtotal = Math.max(0, subtotalTaxable);
    
    // Calculate GST (18% by default)
    const taxAmount = parseFloat((finalSubtotal * taxRate).toFixed(2));
    
    // Total gross amount
    const totalGross = parseFloat((finalSubtotal + taxAmount).toFixed(2));


    const totalDeductions = damageCharges + cleaningCharges + penaltyCharges + extraTimeCharges;
    const refundAmount = Math.max(0, depositAmount - totalDeductions);
    const remainingDueFromDeposit = Math.max(0, totalDeductions - depositAmount);

    return {
      rentalCharges: baseRate,
      extraTimeCharges,
      penaltyCharges,
      damageCharges,
      cleaningCharges,
      depositAmount,
      discountAmount: discount,
      taxAmount,
      subtotal: finalSubtotal,
      total: totalGross,
      depositRefund: refundAmount,
      netPayable: totalGross
    };
  }


  generateInvoiceNumber(rentalId) {
    const year = new Date().getFullYear();
    const paddedId = String(rentalId).padStart(4, '0');
    return `INV-${year}-${paddedId}`;
  }
}

module.exports = new InvoiceGenerator();
