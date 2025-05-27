// scripts/savingsgoalcalc-script.js

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
    const targetGoalInput = document.getElementById('targetGoal');
    const yearsToReachGoalInput = document.getElementById('yearsToReachGoal');
    const currentSavingsInput = document.getElementById('currentSavings');
    const annualRateOfReturnInput = document.getElementById('annualRateOfReturn');
    const calculateBtn = document.getElementById('calculateBtn');

    // --- Output elements ---
    const requiredMonthlySavingsSpan = document.getElementById('requiredMonthlySavings');
    const explanationTextP = document.getElementById('explanationText');
    const savingsGoalChartCanvas = document.getElementById('savingsGoalChart'); // Get the canvas element

    let savingsGoalChart; // Variable to hold the Chart.js instance

    // --- Core Calculation Function ---
    function calculateSavingsGoal() {
        console.log('Calculating Savings Goal...'); // Debugging log

        const targetGoal = parseFloat(targetGoalInput.value) || 0;
        const years = parseFloat(yearsToReachGoalInput.value) || 0;
        const currentSavings = parseFloat(currentSavingsInput.value) || 0;
        const annualRate = parseFloat(annualRateOfReturnInput.value) / 100 || 0; // Convert to decimal

        console.log(`Inputs: Target=${targetGoal}, Years=${years}, CurrentSavings=${currentSavings}, AnnualRate=${annualRate}`); // Debugging logs

        // --- Input Validation ---
        if (isNaN(targetGoal) || targetGoal <= 0) {
            console.error('Validation Error: Target Savings Goal must be greater than 0.');
            alert('Please enter a valid target savings goal (must be greater than 0).');
            resetResults();
            return;
        }
        if (isNaN(years) || years <= 0) {
            console.error('Validation Error: Years to Reach Goal must be greater than 0.');
            alert('Please enter a valid number of years to reach the goal (must be greater than 0).');
            resetResults();
            return;
        }
        if (isNaN(currentSavings) || currentSavings < 0) {
            console.error('Validation Error: Current Savings must be non-negative.');
            alert('Please enter a valid current savings amount (can be 0).');
            resetResults();
            return;
        }
        if (isNaN(annualRate) || annualRate < 0) {
            console.error('Validation Error: Annual Rate of Return must be non-negative.');
            alert('Please enter a valid annual rate of return (can be 0).');
            resetResults();
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

        let principalFromNewContributions = 0;
        let interestFromCurrentSavings = futureValueOfCurrentSavings - currentSavings;
        let interestFromNewContributions = 0;

        if (fvNeededFromContributions <= 0) {
            requiredMonthlySavings = 0;
            explanation = `Your current savings of $${currentSavings.toFixed(2)} will grow to $${futureValueOfCurrentSavings.toFixed(2)} in ${years} years, already meeting or exceeding your goal of $${targetGoal.toFixed(2)}. No additional monthly savings are required.`;
            principalFromNewContributions = 0; // No new contributions needed
            interestFromNewContributions = 0;
        } else {
            if (monthlyRate === 0) {
                // If interest rate is 0, simple division
                requiredMonthlySavings = fvNeededFromContributions / totalMonths;
                principalFromNewContributions = requiredMonthlySavings * totalMonths;
                interestFromNewContributions = 0;
            } else {
                // Calculate required monthly payment using the Future Value of an Ordinary Annuity formula, rearranged for PMT
                // PMT = FV * (r / ((1 + r)^n - 1))
                requiredMonthlySavings = fvNeededFromContributions * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1));

                // Calculate the future value of these regular payments to determine principal and interest
                const fvOfMonthlyContributions = requiredMonthlySavings * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
                principalFromNewContributions = requiredMonthlySavings * totalMonths;
                interestFromNewContributions = fvOfMonthlyContributions - principalFromNewContributions;
            }
            explanation = `To reach your goal of $${targetGoal.toFixed(2)} in ${years} years, starting with $${currentSavings.toFixed(2)}, you will need to save **$${requiredMonthlySavings.toFixed(2)}** monthly, assuming a ${annualRate * 100}% annual return.`;
        }

        // Ensure negative interest values are treated as 0 for display/charting
        if (interestFromCurrentSavings < 0) interestFromCurrentSavings = 0;
        if (interestFromNewContributions < 0) interestFromNewContributions = 0;


        // --- Display Results ---
        requiredMonthlySavingsSpan.textContent = `$${Math.max(0, requiredMonthlySavings).toFixed(2)}`;
        explanationTextP.textContent = explanation;
        explanationTextP.style.display = 'block';

        // Update the chart with the new data
        updateChart(currentSavings, interestFromCurrentSavings, principalFromNewContributions, interestFromNewContributions);
        console.log('Savings Goal calculation complete. Monthly Savings:', requiredMonthlySavings, 'Future value of current savings:', futureValueOfCurrentSavings); // Debugging log
    }

    // --- Chart Update Function ---
    function updateChart(currentSavingsPrincipal, currentSavingsInterest, newContributionsPrincipal, newContributionsInterest) {
        console.log('Updating chart with data:', { currentSavingsPrincipal, currentSavingsInterest, newContributionsPrincipal, newContributionsInterest }); // Debugging: Chart data received

        if (savingsGoalChart) {
            savingsGoalChart.destroy(); // Destroy existing chart before creating a new one
        }

        const dataValues = [
            currentSavingsPrincipal,
            currentSavingsInterest,
            newContributionsPrincipal,
            newContributionsInterest
        ].map(val => Math.max(0, val)); // Ensure no negative values go into the chart

        const labels = [
            'Current Savings Principal',
            'Interest from Current Savings',
            'New Contributions Principal',
            'Interest from New Contributions'
        ];
        const backgroundColors = [
            '#4CAF50', // Green for current principal
            '#81C784', // Lighter Green for current interest
            '#2196F3', // Blue for new contributions principal
            '#64B5F6'  // Lighter Blue for new contributions interest
        ];

        // Filter out zero values for a cleaner chart, unless all values are zero
        const filteredData = [];
        const filteredLabels = [];
        const filteredColors = [];
        let allZero = true;

        for (let i = 0; i < dataValues.length; i++) {
            if (dataValues[i] > 0) {
                filteredData.push(dataValues[i]);
                filteredLabels.push(labels[i]);
                filteredColors.push(backgroundColors[i]);
                allZero = false;
            }
        }

        if (allZero) {
            // If all values are zero, show a single "No Data" slice
            filteredData.push(1); // Small dummy value to display a slice
            filteredLabels.push('No Savings Projected');
            filteredColors.push('#CCCCCC');
        }


        savingsGoalChart = new Chart(savingsGoalChartCanvas, {
            type: 'pie',
            data: {
                labels: filteredLabels,
                datasets: [{
                    data: filteredData,
                    backgroundColor: filteredColors,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom', // Place legend below the chart
                    },
                    title: {
                        display: false, // Title handled by HTML h3
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.raw);
                                return label;
                            }
                        }
                    }
                }
            }
        });
        console.log('Savings Goal Chart created/updated.'); // Debugging log
    }

    // --- Helper function to reset results on invalid input ---
    function resetResults() {
        requiredMonthlySavingsSpan.textContent = '$0.00';
        explanationTextP.textContent = '';
        explanationTextP.style.display = 'none';
        updateChart(0, 0, 0, 0); // Clear chart
    }

    // --- Event Listeners for Live Update and Button ---
    const debouncedCalculate = debounce(calculateSavingsGoal, 300); // Debounce for 300ms

    // Attach 'input' listeners to all number fields for live updates
    targetGoalInput.addEventListener('input', debouncedCalculate);
    yearsToReachGoalInput.addEventListener('input', debouncedCalculate);
    currentSavingsInput.addEventListener('input', debouncedCalculate);
    annualRateOfReturnInput.addEventListener('input', debouncedCalculate);

    // Attach 'click' listener to the calculate button (for immediate calculation if preferred)
    calculateBtn.addEventListener('click', calculateSavingsGoal);

    // Initial calculation on page load to display default values
    calculateSavingsGoal();
});
