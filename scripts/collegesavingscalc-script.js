// scripts/collegesavingscalc-script.js

// --- Debounce Function ---
// Prevents a function from being called too frequently, useful for input events.
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    // --- Input elements ---
    const childCurrentAgeInput = document.getElementById('childCurrentAge');
    const collegeStartAgeInput = document.getElementById('collegeStartAge');
    const currentSavingsInput = document.getElementById('currentSavings');
    const annualContributionInput = document.getElementById('annualContribution');
    const currentAnnualCollegeCostInput = document.getElementById('currentAnnualCollegeCost');
    const collegeCostInflationRateInput = document.getElementById('collegeCostInflationRate');
    const investmentReturnRateInput = document.getElementById('investmentReturnRate');
    const yearsInCollegeInput = document.getElementById('yearsInCollege');
    const calculateBtn = document.getElementById('calculateBtn');

    // --- Output elements ---
    const yearsUntilCollegeSpan = document.getElementById('yearsUntilCollege');
    const projectedTotalCollegeCostSpan = document.getElementById('projectedTotalCollegeCost');
    const projectedSavingsAtStartSpan = document.getElementById('projectedSavingsAtStart');
    const totalPrincipalSavedSpan = document.getElementById('totalPrincipalSaved');
    const totalInterestEarnedSpan = document.getElementById('totalInterestEarned');
    const savingsGapSurplusSpan = document.getElementById('savingsGapSurplus');
    const collegeSavingsChartCanvas = document.getElementById('collegeSavingsChart'); // Get the canvas element

    let collegeSavingsChart; // Variable to hold the Chart.js instance

    // --- Core Calculation Function ---
    function calculateCollegeSavings() {
        console.log('Calculating College Savings...'); // Debugging log

        const childCurrentAge = parseInt(childCurrentAgeInput.value) || 0;
        const collegeStartAge = parseInt(collegeStartAgeInput.value) || 0;
        let currentSavings = parseFloat(currentSavingsInput.value) || 0;
        const annualContribution = parseFloat(annualContributionInput.value) || 0;
        let currentAnnualCollegeCost = parseFloat(currentAnnualCollegeCostInput.value) || 0;
        const collegeCostInflationRate = parseFloat(collegeCostInflationRateInput.value) / 100 || 0;
        const investmentReturnRate = parseFloat(investmentReturnRateInput.value) / 100 || 0;
        const yearsInCollege = parseInt(yearsInCollegeInput.value) || 0;

        console.log(`Inputs: ChildAge=${childCurrentAge}, StartAge=${collegeStartAge}, CurrentSavings=${currentSavings}, AnnualCont=${annualContribution}, CurrentCost=${currentAnnualCollegeCost}, CostInflation=${collegeCostInflationRate}, ReturnRate=${investmentReturnRate}, YearsInCollege=${yearsInCollege}`); // Debugging logs

        // --- Input Validation ---
        if (isNaN(childCurrentAge) || childCurrentAge < 0) {
            console.error('Validation Error: Child\'s Current Age must be 0 or older.');
            alert('Please enter a valid current age for the child (0 or older).');
            resetResults();
            return;
        }
        if (isNaN(collegeStartAge) || collegeStartAge <= childCurrentAge) {
            console.error('Validation Error: College Start Age must be greater than current age.');
            alert('Please enter a valid college start age (must be greater than current age).');
            resetResults();
            return;
        }
        if (isNaN(currentSavings) || currentSavings < 0) {
            console.error('Validation Error: Current Savings must be non-negative.');
            alert('Please enter a valid current savings amount (can be 0).');
            resetResults();
            return;
        }
        if (isNaN(annualContribution) || annualContribution < 0) {
            console.error('Validation Error: Annual Contribution must be non-negative.');
            alert('Please enter a valid annual contribution (can be 0).');
            resetResults();
            return;
        }
        if (isNaN(currentAnnualCollegeCost) || currentAnnualCollegeCost <= 0) {
            console.error('Validation Error: Current Annual College Cost must be greater than 0.');
            alert('Please enter a valid current annual college cost.');
            resetResults();
            return;
        }
        if (isNaN(collegeCostInflationRate) || collegeCostInflationRate < 0) {
            console.error('Validation Error: College Cost Inflation Rate must be non-negative.');
            alert('Please enter a valid annual college cost inflation rate.');
            resetResults();
            return;
        }
        if (isNaN(investmentReturnRate) || investmentReturnRate < 0) {
            console.error('Validation Error: Investment Return Rate must be non-negative.');
            alert('Please enter a valid annual investment return rate.');
            resetResults();
            return;
        }
        if (isNaN(yearsInCollege) || yearsInCollege <= 0) {
            console.error('Validation Error: Years in College must be greater than 0.');
            alert('Please enter a valid number of years in college.');
            resetResults();
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

        let totalInterestEarned = projectedSavings - totalPrincipalSaved;
        if (totalInterestEarned < 0) { // Ensure interest is not negative if initial savings/contributions are 0
            totalInterestEarned = 0;
        }


        // --- Calculate Projected Total College Cost ---
        let projectedTotalCollegeCost = 0;
        let annualCollegeCostAtStart = currentAnnualCollegeCost;

        // Inflate the *initial* annual cost to the year college starts
        for (let year = 0; year < yearsUntilCollege; year++) {
            annualCollegeCostAtStart *= (1 + collegeCostInflationRate);
        }

        let currentAnnualCostDuringCollege = annualCollegeCostAtStart;
        for (let year = 0; year < yearsInCollege; year++) {
            projectedTotalCollegeCost += currentAnnualCostDuringCollege;
            currentAnnualCostDuringCollege *= (1 + collegeCostInflationRate); // Inflate for subsequent years in college
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
        // Update class for styling based on gap/surplus
        savingsGapSurplusSpan.classList.remove('highlight-positive', 'highlight-negative');
        if (savingsGapSurplus >= 0) {
            savingsGapSurplusSpan.classList.add('highlight-positive');
        } else {
            savingsGapSurplusSpan.classList.add('highlight-negative');
        }

        // Update the chart with the new data
        updateChart(totalPrincipalSaved, totalInterestEarned);
        console.log('College Savings calculation complete. Principal:', totalPrincipalSaved, 'Interest:', totalInterestEarned, 'Projected Savings:', projectedSavings, 'Total College Cost:', projectedTotalCollegeCost, 'Gap/Surplus:', savingsGapSurplus); // Debugging log
    }

    // --- Chart Update Function ---
    function updateChart(principal, interest) {
        console.log('Updating chart with data:', { principal, interest }); // Debugging: Chart data received

        if (collegeSavingsChart) {
            collegeSavingsChart.destroy(); // Destroy existing chart before creating a new one
        }

        // Only create chart if there's data to display
        if (principal > 0 || interest > 0) {
            collegeSavingsChart = new Chart(collegeSavingsChartCanvas, {
                type: 'pie',
                data: {
                    labels: ['Total Principal Saved', 'Total Interest Earned'],
                    datasets: [{
                        data: [principal, interest],
                        backgroundColor: ['#007bff', '#28a745'], // Blue for Principal, Green for Interest
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true, // IMPORTANT: Set this to TRUE
                    aspectRatio: 1, // IMPORTANT: Add this to force a 1:1 aspect ratio (square)
                    plugins: {
                        legend: {
                            position: 'bottom', // Place legend below the chart
                        },
                        title: {
                            display: false, // Title handled by HTML h3
                        }
                    }
                }
            });
            console.log('College Savings Chart created.'); // Debugging log
        } else {
            // Clear canvas if no data (e.g., all inputs are zero or invalid)
            const ctx = collegeSavingsChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, collegeSavingsChartCanvas.width, collegeSavingsChartCanvas.height);
            console.log('No data for College Savings Chart, canvas cleared.'); // Debugging log
        }
    }

    // --- Helper function to reset results on invalid input ---
    function resetResults() {
        yearsUntilCollegeSpan.textContent = '0';
        projectedTotalCollegeCostSpan.textContent = '$0.00';
        projectedSavingsAtStartSpan.textContent = '$0.00';
        totalPrincipalSavedSpan.textContent = '$0.00';
        totalInterestEarnedSpan.textContent = '$0.00';
        savingsGapSurplusSpan.textContent = '$0.00';
        savingsGapSurplusSpan.classList.remove('highlight-positive', 'highlight-negative');
        updateChart(0, 0); // Clear chart
    }

    // --- Event Listeners for Live Update and Button ---
    const debouncedCalculate = debounce(calculateCollegeSavings, 300); // Debounce for 300ms

    // Attach 'input' listeners to all number fields for live updates
    childCurrentAgeInput.addEventListener('input', debouncedCalculate);
    collegeStartAgeInput.addEventListener('input', debouncedCalculate);
    currentSavingsInput.addEventListener('input', debouncedCalculate);
    annualContributionInput.addEventListener('input', debouncedCalculate);
    currentAnnualCollegeCostInput.addEventListener('input', debouncedCalculate);
    collegeCostInflationRateInput.addEventListener('input', debouncedCalculate);
    investmentReturnRateInput.addEventListener('input', debouncedCalculate);
    yearsInCollegeInput.addEventListener('input', debouncedCalculate);

    // Attach 'click' listener to the calculate button (for immediate calculation if preferred)
    calculateBtn.addEventListener('click', calculateCollegeSavings);

    // Initial calculation on page load to display default values
    calculateCollegeSavings();
});
