document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const periodicPaymentInput = document.getElementById('periodicPayment');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const numberOfYearsInput = document.getElementById('numberOfYears');
    const frequencySelect = document.getElementById('frequency');
    const annuityTypeRadios = document.querySelectorAll('input[name="annuityType"]');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements
    const futureValueSpan = document.getElementById('futureValue');

    calculateBtn.addEventListener('click', calculateFutureValue);

    function calculateFutureValue() {
        const PMT = parseFloat(periodicPaymentInput.value);
        const annualRate = parseFloat(annualInterestRateInput.value);
        const years = parseFloat(numberOfYearsInput.value);
        const frequency = parseInt(frequencySelect.value); // Payments per year & compounding periods per year
        const annuityType = document.querySelector('input[name="annuityType"]:checked').value;

        // --- Input Validation ---
        if (isNaN(PMT) || PMT < 0) {
            alert('Please enter a valid periodic payment amount (0 or greater).');
            return;
        }
        if (isNaN(annualRate) || annualRate < 0) {
            alert('Please enter a valid annual interest rate (0 or greater).');
            return;
        }
        if (isNaN(years) || years <= 0) {
            alert('Please enter a valid number of years (greater than 0).');
            return;
        }

        const periodicRate = annualRate / 100 / frequency; // r
        const totalPeriods = years * frequency; // n

        let futureValue = 0;

        if (periodicRate === 0) {
            // Simple multiplication if interest rate is 0
            futureValue = PMT * totalPeriods;
        } else {
            // Future Value of Ordinary Annuity: FV = PMT * [((1 + r)^n - 1) / r]
            const fvOrdinaryAnnuityFactor = (Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate;
            futureValue = PMT * fvOrdinaryAnnuityFactor;

            // Adjust for Annuity Due: FV_AD = FV_OA * (1 + r)
            if (annuityType === 'due') {
                futureValue *= (1 + periodicRate);
            }
        }

        // --- Display Result ---
        futureValueSpan.textContent = `$${futureValue.toFixed(2)}`;
    }

    // Initial calculation on page load
    calculateFutureValue();
});
