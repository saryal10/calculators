document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const initialInvestmentInput = document.getElementById('initialInvestment');
    const annualContributionInput = document.getElementById('annualContribution');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const compoundingFrequencySelect = document.getElementById('compoundingFrequency');
    const investmentPeriodInput = document.getElementById('investmentPeriod');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements
    const totalPrincipalInvestedSpan = document.getElementById('totalPrincipalInvested');
    const totalInterestEarnedSpan = document.getElementById('totalInterestEarned');
    const endingBalanceSpan = document.getElementById('endingBalance');

    calculateBtn.addEventListener('click', calculateCompoundInterest);

    function calculateCompoundInterest() {
        let initialInvestment = parseFloat(initialInvestmentInput.value);
        let annualContribution = parseFloat(annualContributionInput.value);
        const annualInterestRate = parseFloat(annualInterestRateInput.value);
        const compoundingFrequency = compoundingFrequencySelect.value;
        const investmentPeriodYears = parseFloat(investmentPeriodInput.value);

        // --- Input Validation ---
        if (isNaN(initialInvestment) || initialInvestment < 0) {
            alert('Please enter a valid initial investment (can be 0).');
            return;
        }
        if (isNaN(annualContribution) || annualContribution < 0) {
            alert('Please enter a valid annual contribution (can be 0).');
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            alert('Please enter a valid annual interest rate.');
            return;
        }
        if (isNaN(investmentPeriodYears) || investmentPeriodYears <= 0) {
            alert('Please enter a valid investment period in years.');
            return;
        }

        const rate = annualInterestRate / 100;

        let compoundingPeriodsPerYear;
        switch (compoundingFrequency) {
            case 'annually':
                compoundingPeriodsPerYear = 1;
                break;
            case 'quarterly':
                compoundingPeriodsPerYear = 4;
                break;
            case 'monthly':
                compoundingPeriodsPerYear = 12;
                break;
            case 'daily':
                compoundingPeriodsPerYear = 365; // Assuming 365 days
                break;
            default:
                compoundingPeriodsPerYear = 12; // Default to monthly if somehow not set
        }

        const totalCompoundingPeriods = investmentPeriodYears * compoundingPeriodsPerYear;
        const periodicRate = rate / compoundingPeriodsPerYear;
        const periodicContribution = annualContribution / compoundingPeriodsPerYear;

        let currentBalance = initialInvestment;
        let totalPrincipalAdded = initialInvestment; // Tracks initial + all contributions

        for (let i = 1; i <= totalCompoundingPeriods; i++) {
            // Add periodic contribution before compounding interest (contributions at start of period)
            currentBalance += periodicContribution;
            totalPrincipalAdded += periodicContribution; // Accumulate principal for tracking

            // Apply interest
            currentBalance *= (1 + periodicRate);
        }

        // Adjust totalPrincipalAdded as the last periodic contribution might have been added
        // for a period that hasn't fully passed for the total growth calc (simplification)
        // A more precise way would track actual principal vs. accrued interest separately.
        // For simplicity, totalPrincipalAdded includes the initial + all contributions over the period.

        const totalInterestEarned = currentBalance - totalPrincipalAdded;


        // --- Display Results ---
        totalPrincipalInvestedSpan.textContent = `$${totalPrincipalAdded.toFixed(2)}`;
        totalInterestEarnedSpan.textContent = `$${totalInterestEarned.toFixed(2)}`;
        endingBalanceSpan.textContent = `$${currentBalance.toFixed(2)}`;
    }

    // Initial calculation on page load
    calculateCompoundInterest();
});
