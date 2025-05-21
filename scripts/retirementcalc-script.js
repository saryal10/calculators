document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const currentAgeInput = document.getElementById('currentAge');
    const retirementAgeInput = document.getElementById('retirementAge');
    const currentSavingsInput = document.getElementById('currentSavings');
    const annualContributionInput = document.getElementById('annualContribution');
    const annualReturnRateInput = document.getElementById('annualReturnRate');
    const annualInflationRateInput = document.getElementById('annualInflationRate');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements
    const yearsUntilRetirementSpan = document.getElementById('yearsUntilRetirement');
    const totalPrincipalInvestedSpan = document.getElementById('totalPrincipalInvested');
    const totalInterestEarnedSpan = document.getElementById('totalInterestEarned');
    const projectedNominalBalanceSpan = document.getElementById('projectedNominalBalance');
    const projectedRealBalanceSpan = document.getElementById('projectedRealBalance');

    calculateBtn.addEventListener('click', calculateRetirementSavings);

    function calculateRetirementSavings() {
        const currentAge = parseInt(currentAgeInput.value);
        const retirementAge = parseInt(retirementAgeInput.value);
        let currentSavings = parseFloat(currentSavingsInput.value);
        const annualContribution = parseFloat(annualContributionInput.value);
        const annualReturnRate = parseFloat(annualReturnRateInput.value) / 100;
        const annualInflationRate = parseFloat(annualInflationRateInput.value) / 100;

        // --- Input Validation ---
        if (isNaN(currentAge) || currentAge < 18) {
            alert('Please enter a valid current age (must be 18 or older).');
            return;
        }
        if (isNaN(retirementAge) || retirementAge <= currentAge) {
            alert('Please enter a valid retirement age (must be greater than your current age).');
            return;
        }
        if (isNaN(currentSavings) || currentSavings < 0) {
            alert('Please enter a valid current savings amount (can be 0).');
            return;
        }
        if (isNaN(annualContribution) || annualContribution < 0) {
            alert('Please enter a valid annual contribution (can be 0).');
            return;
        }
        if (isNaN(annualReturnRate) || annualReturnRate < 0) {
            alert('Please enter a valid annual rate of return.');
            return;
        }
        if (isNaN(annualInflationRate) || annualInflationRate < 0) {
            alert('Please enter a valid annual inflation rate.');
            return;
        }

        const yearsToRetirement = retirementAge - currentAge;

        let projectedNominalBalance = currentSavings;
        let totalPrincipalInvested = currentSavings; // Tracks initial + all future contributions

        // Loop through each year
        for (let i = 0; i < yearsToRetirement; i++) {
            // Add annual contribution at the beginning of each year (then it compounds for the full year)
            projectedNominalBalance += annualContribution;
            totalPrincipalInvested += annualContribution;

            // Apply annual return
            projectedNominalBalance *= (1 + annualReturnRate);
        }

        const totalInterestEarned = projectedNominalBalance - totalPrincipalInvested;

        // Adjust for inflation (convert future nominal value to today's real value)
        const projectedRealBalance = projectedNominalBalance / Math.pow(1 + annualInflationRate, yearsToRetirement);


        // --- Display Results ---
        yearsUntilRetirementSpan.textContent = yearsToRetirement;
        totalPrincipalInvestedSpan.textContent = `$${totalPrincipalInvested.toFixed(2)}`;
        totalInterestEarnedSpan.textContent = `$${totalInterestEarned.toFixed(2)}`;
        projectedNominalBalanceSpan.textContent = `$${projectedNominalBalance.toFixed(2)}`;
        projectedRealBalanceSpan.textContent = `$${projectedRealBalance.toFixed(2)}`;
    }

    // Initial calculation on page load
    calculateRetirementSavings();
});
