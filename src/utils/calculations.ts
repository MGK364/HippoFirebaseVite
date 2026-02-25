import { AnesthesiaBolus, AnesthesiaCRI } from '../types';

/**
 * Calculates the total duration of a CRI in hours.
 * @param cri The CRI object.
 * @param procedureEndTime The overall end time to use if the CRI hasn't stopped.
 * @returns Duration in hours.
 */
const calculateCRIDurationHours = (cri: AnesthesiaCRI, procedureEndTime: Date): number => {
    const startTime = cri.startTime instanceof Date ? cri.startTime : new Date(cri.startTime);
    // If CRI has an end time, use it. Otherwise, use the procedure end time.
    const endTime = cri.endTime ? 
                    (cri.endTime instanceof Date ? cri.endTime : new Date(cri.endTime)) 
                    : procedureEndTime;

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || endTime <= startTime) {
        return 0; // Invalid or zero duration
    }

    const durationMillis = endTime.getTime() - startTime.getTime();
    return durationMillis / (1000 * 60 * 60); // Convert milliseconds to hours
};

/**
 * Calculates the total amount of drug administered via a CRI, considering rate changes.
 * Assumes rate is per hour (e.g., mg/hr, mcg/kg/hr).
 * If rate is per minute, the calculation needs adjustment.
 * @param cri The CRI object.
 * @param procedureEndTime The overall end time.
 * @param patientWeightKg Optional patient weight for per-kg dosages.
 * @returns Total amount administered (unit depends on CRI's unit).
 */
const calculateCRITotalAmount = (
    cri: AnesthesiaCRI, 
    procedureEndTime: Date, 
    patientWeightKg?: number
): number => {
    const startTime = cri.startTime instanceof Date ? cri.startTime : new Date(cri.startTime);
    const finalEndTime = cri.endTime ? 
                         (cri.endTime instanceof Date ? cri.endTime : new Date(cri.endTime)) 
                         : procedureEndTime;

    if (isNaN(startTime.getTime()) || isNaN(finalEndTime.getTime()) || finalEndTime <= startTime) {
        return 0;
    }

    let totalAmount = 0;
    let lastTimestamp = startTime;

    // Sort rate history chronologically
    const sortedHistory = cri.rateHistory?.length 
        ? [...cri.rateHistory].sort((a, b) => 
            (a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp)).getTime() - 
            (b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp)).getTime()
          )
        : [];

    // Iterate through rate changes to calculate amount for each period
    for (const entry of sortedHistory) {
        const entryTime = entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp);
        
        // Duration at the *previous* rate (or initial rate)
        const durationAtRateMillis = entryTime.getTime() - lastTimestamp.getTime();
        if (durationAtRateMillis > 0) {
            const durationHours = durationAtRateMillis / (1000 * 60 * 60);
            const rate = sortedHistory.find(h => h.timestamp === lastTimestamp)?.rate || entry.rate; // Use rate active *during* this period
            
            let effectiveRate = rate;
            // Adjust rate if it's per kg
            if (cri.unit.includes('/kg/') && patientWeightKg && patientWeightKg > 0) {
                effectiveRate = rate * patientWeightKg;
            }
             // **IMPORTANT**: Assumes rate is per HOUR. If rate is per MINUTE, divide durationHours by 60.
            totalAmount += effectiveRate * durationHours; 
        }
        lastTimestamp = entryTime;
    }

    // Calculate amount for the last period (from last rate change to final end time)
    const lastPeriodDurationMillis = finalEndTime.getTime() - lastTimestamp.getTime();
    if (lastPeriodDurationMillis > 0 && sortedHistory.length > 0) {
        const lastPeriodDurationHours = lastPeriodDurationMillis / (1000 * 60 * 60);
        const lastRate = sortedHistory[sortedHistory.length - 1].rate;
        
        let effectiveRate = lastRate;
        if (cri.unit.includes('/kg/') && patientWeightKg && patientWeightKg > 0) {
            effectiveRate = lastRate * patientWeightKg;
        }
        // **IMPORTANT**: Assumes rate is per HOUR.
        totalAmount += effectiveRate * lastPeriodDurationHours;
    }
     // Handle case with no rate history (only initial rate)
     else if (lastPeriodDurationMillis > 0 && sortedHistory.length === 0) {
        const durationHours = lastPeriodDurationMillis / (1000 * 60 * 60);
        let effectiveRate = cri.rate; // Use the initial rate
        if (cri.unit.includes('/kg/') && patientWeightKg && patientWeightKg > 0) {
            effectiveRate = cri.rate * patientWeightKg;
        }
        totalAmount += effectiveRate * durationHours;
    }

    return totalAmount;
};

/**
 * Calculates total amounts for all boluses and CRIs.
 * @param boluses Array of AnesthesiaBolus objects.
 * @param cris Array of AnesthesiaCRI objects.
 * @param procedureEndTime The overall end time for CRI calculations.
 * @param patientWeightKg Optional patient weight.
 * @returns An object mapping medication names to their total amount and unit.
 */
export const calculateMedicationTotals = (
    boluses: AnesthesiaBolus[],
    cris: AnesthesiaCRI[],
    procedureEndTime: Date,
    patientWeightKg?: number
): Record<string, { totalAmount: number; unit: string }> => {
    const totals: Record<string, { totalAmount: number; unit: string }> = {};

    // Process Boluses
    boluses.forEach(bolus => {
        const baseUnit = bolus.unit.replace('/kg', ''); // Get base unit (e.g., mg from mg/kg)
        let amount = bolus.dose;

        // Adjust amount if dose is per kg
        if (bolus.unit.includes('/kg') && patientWeightKg && patientWeightKg > 0) {
            amount = bolus.dose * patientWeightKg;
        }

        if (!totals[bolus.name]) {
            totals[bolus.name] = { totalAmount: 0, unit: baseUnit };
        }
        totals[bolus.name].totalAmount += amount;
    });

    // Process CRIs
    cris.forEach(cri => {
        const totalAmount = calculateCRITotalAmount(cri, procedureEndTime, patientWeightKg);
        // Derive the final unit (e.g., mg from mg/hr or mg/kg/hr)
        let finalUnit = cri.unit.split('/')[0]; // Assumes unit format like 'mg/hr' or 'mcg/kg/min'
        if (cri.unit.includes('/kg/')) {
             finalUnit = cri.unit.split('/kg')[0]; // e.g. mcg from mcg/kg/min
        }

        if (!totals[cri.name]) {
            totals[cri.name] = { totalAmount: 0, unit: finalUnit };
        }
        // Add calculated total amount (already adjusted for weight and time)
        totals[cri.name].totalAmount += totalAmount;
    });

    return totals;
}; 