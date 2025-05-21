document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const childCurrentAgeInput = document.getElementById('childCurrentAge');
    const collegeStartAgeInput = document.getElementById('collegeStartAge');
    const currentSavingsInput = document.getElementById('currentSavings');
    const annualContributionInput = document.getElementById('annualContribution');
    const currentAnnualCollegeCostInput = document.getElementById('currentAnnualCollegeCost');
    const collegeCostInflationRateInput = document.getElementById('collegeCostInflationRate');
    const investmentReturnRateInput = document.getElementById('investmentReturnRate');
    const yearsInCollegeInput = document.getElementById('yearsInCollege');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements
    const yearsUntilCollegeSpan = document.getElementById('yearsUntilCollege');
    const projectedTotalCollegeCostSpan = document.getElementById('projectedTotalCollegeCost');
    const projectedSavingsAtStartSpan = document.getElementById('projectedSavingsAtStart');
    const totalPrincipalSavedSpan = document.getElementById('totalPrincipalSaved');
    const totalInterestEarnedSpan = document.getElementById('totalInterestEarned');
    const savingsGapSurplusSpan = document.getElementById('savingsGapSurplus');

    calculateBtn.addEventListener('click', calculateCollegeSavings);

    function calculateCollegeSavings() {
        const childCurrentAge = parseInt(childCurrentAgeInput.value);
        const collegeStartAge = parseInt(collegeStartAgeInput.value);
        let currentSavings = parseFloat(currentSavingsInput.value);
        const annualContribution = parseFloat(annualContributionInput.value);
        let currentAnnualCollegeCost = parseFloat(currentAnnualCollegeCostInput.value);
        const collegeCostInflationRate = parseFloat(collegeCostInflationRateInput.value) / 100;
        const investmentReturnRate = parseFloat(investmentReturnRateInput.value) / 100;
        const yearsInCollege = parseInt(yearsInCollegeInput.value);

        // --- Input Validation ---
        if (isNaN(childCurrentAge) || childCurrentAge < 0) {
            alert('Please enter a valid current age for the child (0 or older).');
            return;
        }
        if (isNaN(collegeStartAge) || collegeStartAge <= childCurrentAge) {
            alert('Please enter a valid college start age (must be greater than current age).');
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
        if (isNaN(currentAnnualCollegeCost) || currentAnnualCollegeCost <= 0) {
            alert('Please enter a valid current annual college cost.');
            return;
        }
        if (isNaN(collegeCostInflationRate) || collegeCostInflationRate < 0) {
            alert('Please enter a valid annual college cost inflation rate.');
            return;
        }
        if (isNaN(investmentReturnRate) || investmentReturnRate < 0) {
            alert('Please enter a valid annual investment return rate.');
            return;
        }
        if (isNaN(yearsInCollege) || yearsInCollege <= 0) {
            alert('Please enter a valid number of years in college.');
            return;
        }

        const yearsUntilCollege = collegeStartAge - childCurrentAge;

        // --- Calculate Projected Savings at College Start ---
        let projectedSavings = currentSavings;
        let totalPrincipalSaved = currentSavings;

        for (let year = 0; year < yearsUntilCollege; year++) {
            projectedSavings += annualContribution; // Add contribution at start of year
            totalPrincipalSaved += annualContribution; // Track principal
            projectedSavings *= (1 + investmentReturnRate); // Apply investment return
        }

        const totalInterestEarned = projectedSavings - totalPrincipalSaved;

        // --- Calculate Projected Total College Cost ---
        let projectedTotalCollegeCost = 0;
        let costOfFirstYearCollege = currentAnnualCollegeCost;

        // Inflate the cost to the year college starts
        for (let year = 0; year < yearsUntilCollege; year++) {
            costOfFirstYearCollege *= (1 + collegeCostInflationRate);
        }

        let annualCollegeCost = costOfFirstYearCollege;
        for (let year = 0; year < yearsInCollege; year++) {
            projectedTotalCollegeCost += annualCollegeCost;
            annualCollegeCost *= (1 + collegeCostInflationRate); // Inflate for subsequent years
        }

        // --- Calculate Gap/Surplus ---
        const savingsGapSurplus = projectedSavings - projectedTotalCollegeCost;

        // --- Display Results ---
        yearsUntilCollegeSpan.textContent = yearsUntilCollege;
        projectedTotalCollegeCostSpan.textContent = `$${projectedTotalCollegeCost.toFixed(2)}`;
        projectedSavingsAtStartSpan.textContent = `$${projectedSavings.toFixed(2)}`;
        totalPrincipalSavedSpan.textContent = `$${totalPrincipalSaved.toFixed(2)}`;
        totalInterestEarnedSpan.textContent = `$${totalInterestEarned.toFixed(2)}`;

        savingsGapSurplusSpan.textContent = `$${savingsGapSurplus.toFixed(2)}`;
        savingsGapSurplusSpan.classList.remove('highlight-positive', 'highlight-negative');
        if (savingsGapSurplus >= 0) {
            savingsGapSurplusSpan.classList.add('highlight-positive');
        } else {
            savingsGapSurplusSpan.classList.add('highlight-negative');
        }
    }

    // Initial calculation when the page loads with default values
    calculateCollegeSavings();
});
