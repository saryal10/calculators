document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const initialAmountInput = document.getElementById('initialAmount');
    const annualInflationRateInput = document.getElementById('annualInflationRate');
    const numberOfYearsInput = document.getElementById('numberOfYears');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements
    const displayYearsSpan = document.getElementById('displayYears');
    const futureCostSpan = document.getElementById('futureCost');
    const purchasingPowerSpan = document.getElementById('purchasingPower');

    calculateBtn.addEventListener('click', calculateInflation);

    function calculateInflation() {
        const initialAmount = parseFloat(initialAmountInput.value);
        const annualInflationRate = parseFloat(annualInflationRateInput.value);
        const numberOfYears = parseInt(numberOfYearsInput.value);

        // --- Input Validation ---
        if (isNaN(initialAmount) || initialAmount < 0) {
            alert('Please enter a valid initial amount (can be 0).');
            return;
        }
        if (isNaN(annualInflationRate) || annualInflationRate < 0) {
            alert('Please enter a valid annual inflation rate.');
            return;
        }
        if (isNaN(numberOfYears) || numberOfYears <= 0) {
            alert('Please enter a valid number of years.');
            return;
        }

        const inflationFactor = 1 + (annualInflationRate / 100);

        // Calculate Future Cost: How much money you'll need in the future to buy what 'initialAmount' buys today.
        const futureCost = initialAmount * Math.pow(inflationFactor, numberOfYears);

        // Calculate Purchasing Power: What 'initialAmount' today will be effectively worth in future dollars.
        const purchasingPower = initialAmount / Math.pow(inflationFactor, numberOfYears);


        // --- Display Results ---
        displayYearsSpan.textContent = numberOfYears;
        futureCostSpan.textContent = `$${futureCost.toFixed(2)}`;
        purchasingPowerSpan.textContent = `$${purchasingPower.toFixed(2)}`;
    }

    // Initial calculation on page load
    calculateInflation();
});
