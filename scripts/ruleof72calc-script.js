document.addEventListener('DOMContentLoaded', function() {
    const annualRateInput = document.getElementById('annualRateInput');
    const yearsToDoubleInput = document.getElementById('yearsToDoubleInput');

    const yearsToDoubleSpan = document.getElementById('yearsToDouble');
    const requiredRateSpan = document.getElementById('requiredRate');

    // Function to clear all results
    function clearResults() {
        yearsToDoubleSpan.textContent = '---';
        requiredRateSpan.textContent = '---';
    }

    // Listener for annual rate input
    annualRateInput.addEventListener('input', function() {
        const rate = parseFloat(annualRateInput.value);

        // Clear the other input and its result
        yearsToDoubleInput.value = '';
        requiredRateSpan.textContent = '---';

        if (!isNaN(rate) && rate > 0) {
            const years = 72 / rate;
            yearsToDoubleSpan.textContent = `${years.toFixed(2)} years`;
        } else if (annualRateInput.value === '') {
            clearResults(); // If input is truly empty, clear everything
        } else {
            yearsToDoubleSpan.textContent = 'Invalid input';
        }
    });

    // Listener for years to double input
    yearsToDoubleInput.addEventListener('input', function() {
        const years = parseFloat(yearsToDoubleInput.value);

        // Clear the other input and its result
        annualRateInput.value = '';
        yearsToDoubleSpan.textContent = '---';

        if (!isNaN(years) && years > 0) {
            const rate = 72 / years;
            requiredRateSpan.textContent = `${rate.toFixed(2)}%`;
        } else if (yearsToDoubleInput.value === '') {
            clearResults(); // If input is truly empty, clear everything
        } else {
            requiredRateSpan.textContent = 'Invalid input';
        }
    });

    // Initial state (cleared results)
    clearResults();
});
