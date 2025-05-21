document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const targetGoalInput = document.getElementById('targetGoal');
    const yearsToReachGoalInput = document.getElementById('yearsToReachGoal');
    const currentSavingsInput = document.getElementById('currentSavings');
    const annualRateOfReturnInput = document.getElementById('annualRateOfReturn');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements
    const requiredMonthlySavingsSpan = document.getElementById('requiredMonthlySavings');
    const explanationTextP = document.getElementById('explanationText');

    calculateBtn.addEventListener('click', calculateSavingsGoal);

    function calculateSavingsGoal() {
        const targetGoal = parseFloat(targetGoalInput.value);
        const years = parseFloat(yearsToReachGoalInput.value);
        const currentSavings = parseFloat(currentSavingsInput.value);
        const annualRate = parseFloat(annualRateOfReturnInput.value) / 100; // Convert to decimal

        // --- Input Validation ---
        if (isNaN(targetGoal) || targetGoal <= 0) {
            alert('Please enter a valid target savings goal (must be greater than 0).');
            return;
        }
        if (isNaN(years) || years <= 0) {
            alert('Please enter a valid number of years to reach the goal (must be greater than 0).');
            return;
        }
        if (isNaN(currentSavings) || currentSavings < 0) {
            alert('Please enter a valid current savings amount (can be 0).');
            return;
        }
        if (isNaN(annualRate) || annualRate < 0) {
            alert('Please enter a valid annual rate of return (can be 0).');
            return;
        }

        const totalMonths = years * 12;
        const monthlyRate = annualRate / 12;

        let requiredMonthlySavings = 0;
        let explanation = "";

        // Calculate the future value of current savings
        const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + annualRate, years);

        // Determine how much more is needed from new contributions
        let fvNeededFromContributions = targetGoal - futureValueOfCurrentSavings;

        if (fvNeededFromContributions <= 0) {
            requiredMonthlySavings = 0;
            explanation = `Your current savings of $${currentSavings.toFixed(2)} will grow to $${futureValueOfCurrentSavings.toFixed(2)} in ${years} years, already meeting or exceeding your goal of $${targetGoal.toFixed(2)}. No additional monthly savings are required.`;
            explanationTextP.style.display = 'block';

        } else {
            // Calculate required monthly payment using the Future Value of an Ordinary Annuity formula, rearranged for PMT
            // PMT = FV * (r / ((1 + r)^n - 1))
            if (monthlyRate === 0) {
                // If interest rate is 0, simple division
                requiredMonthlySavings = fvNeededFromContributions / totalMonths;
            } else {
                requiredMonthlySavings = fvNeededFromContributions * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1));
            }
            explanation = `To reach your goal of $${targetGoal.toFixed(2)} in ${years} years, starting with $${currentSavings.toFixed(2)}, you will need to save $${requiredMonthlySavings.toFixed(2)} monthly, assuming a ${annualRate * 100}% annual return.`;
            explanationTextP.style.display = 'block';
        }

        // --- Display Results ---
        requiredMonthlySavingsSpan.textContent = `$${Math.max(0, requiredMonthlySavings).toFixed(2)}`;
        explanationTextP.textContent = explanation;
    }

    // Initial calculation on page load
    calculateSavingsGoal();
});
