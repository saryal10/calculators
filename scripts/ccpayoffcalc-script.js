// scripts/ccpayoffcalc-script.js

// --- DOM Elements ---
const currentBalanceInput = document.getElementById('currentBalance');
const annualInterestRateInput = document.getElementById('annualInterestRate');
const monthlyPaymentInput = document.getElementById('monthlyPayment');
const extraMonthlyPaymentInput = document.getElementById('extraMonthlyPayment');
const calculateBtn = document.getElementById('calculateBtn');

const displayMinPaymentElem = document.getElementById('displayMinPayment');
const minPaymentTimeElem = document.getElementById('minPaymentTime');
const minPaymentInterestElem = document.getElementById('minPaymentInterest');
const minPaymentTotalElem = document.getElementById('minPaymentTotal');

const displayTotalPaymentElem = document.getElementById('displayTotalPayment');
const extraPaymentTimeElem = document.getElementById('extraPaymentTime');
const extraPaymentInterestElem = document.getElementById('extraPaymentInterest');
const extraPaymentTotalElem = document.getElementById('extraPaymentTotal');

const interestSavedElem = document.getElementById('interestSaved');
const timeSavedElem = document.getElementById('timeSaved');

const currentPaymentChartCanvas = document.getElementById('currentPaymentChart');
const extraPaymentChartCanvas = document.getElementById('extraPaymentChart'); // Renamed this ID in HTML and here

let currentPaymentChart = null; // Initialize to null
let extraPaymentChart = null; // Initialize to null

// --- Debounce Function ---
// Prevents a function from being called too frequently.
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// --- Helper Function to Calculate Payoff ---
// Returns an object with payoff details (time, total interest, total paid)
function calculatePayoff(balance, annualRate, monthlyPaymentAmount) {
    let remainingBalance = balance;
    let totalInterestPaid = 0;
    let months = 0;
    const monthlyRate = (annualRate / 100) / 12;

    // --- Input Validation specific to this helper ---
    if (monthlyPaymentAmount <= 0) {
        return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
    }
    // Check if payment is less than monthly interest to prevent infinite loop
    if (balance > 0 && monthlyPaymentAmount <= (balance * monthlyRate) && annualRate > 0) {
        return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
    }

    const MAX_MONTHS = 1200; // Cap calculation at 100 years

    // Using a more robust loop for calculation
    let tempBalance = balance;
    let accurateTotalInterest = 0;
    let accurateMonths = 0;

    for (let i = 0; i < MAX_MONTHS && tempBalance > 0; i++) {
        accurateMonths++;
        const monthlyInterest = tempBalance * monthlyRate;
        accurateTotalInterest += monthlyInterest;
        
        let principalPayment = monthlyPaymentAmount - monthlyInterest;

        // Ensure principalPayment doesn't exceed the remaining balance for the final month
        if (principalPayment > tempBalance) {
            principalPayment = tempBalance;
        }

        tempBalance -= principalPayment;
    }

    if (tempBalance > 0) { // If debt still exists after max months
        return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
    }
    
    const actualTotalPaid = balance + accurateTotalInterest;

    return {
        months: accurateMonths,
        years: Math.floor(accurateMonths / 12),
        remainingMonths: accurateMonths % 12,
        totalInterest: accurateTotalInterest,
        totalPaid: actualTotalPaid
    };
}

// --- Main Calculation and UI Update Function ---
function calculateCreditCardPayoff() {
    console.log('Calculating payoff...'); // Debugging log

    const currentBalance = parseFloat(currentBalanceInput.value) || 0;
    const annualInterestRate = parseFloat(annualInterestRateInput.value) || 0;
    const monthlyPayment = parseFloat(monthlyPaymentInput.value) || 0;
    const extraMonthlyPayment = parseFloat(extraMonthlyPaymentInput.value) || 0;

    console.log(`Inputs: Balance=${currentBalance}, Rate=${annualInterestRate}, Monthly=${monthlyPayment}, Extra=${extraMonthlyPayment}`); // Debugging logs

    // --- Input Validation and Edge Cases ---
    if (currentBalance < 0 || annualInterestRate < 0 || monthlyPayment < 0 || extraMonthlyPayment < 0) {
        alert('Please enter non-negative values for all fields.');
        resetResultsAndCharts();
        return;
    }
    
    if (currentBalance === 0) {
        resetResultsAndCharts();
        return;
    }

    // Scenario 1: With current monthly payment
    const minPayoff = calculatePayoff(currentBalance, annualInterestRate, monthlyPayment);

    // Scenario 2: With extra monthly payment
    const totalMonthlyPayment = monthlyPayment + extraMonthlyPayment;
    const extraPayoff = calculatePayoff(currentBalance, annualInterestRate, totalMonthlyPayment);

    // --- Update UI for Scenario 1 ---
    displayMinPaymentElem.textContent = monthlyPayment.toFixed(2);
    if (minPayoff.months === Infinity) {
        minPaymentTimeElem.textContent = 'Never (Payment too low)';
        minPaymentInterestElem.textContent = '$N/A';
        minPaymentTotalElem.textContent = '$N/A';
    } else {
        minPaymentTimeElem.textContent = `${minPayoff.years} Years, ${minPayoff.remainingMonths} Months`;
        minPaymentInterestElem.textContent = `$${minPayoff.totalInterest.toFixed(2)}`;
        minPaymentTotalElem.textContent = `$${minPayoff.totalPaid.toFixed(2)}`;
    }

    // --- Update UI for Scenario 2 ---
    displayTotalPaymentElem.textContent = totalMonthlyPayment.toFixed(2);
    if (extraPayoff.months === Infinity) {
        extraPaymentTimeElem.textContent = 'Never (Payment too low)';
        extraPaymentInterestElem.textContent = '$N/A';
        extraPaymentTotalElem.textContent = '$N/A';
    } else {
        extraPaymentTimeElem.textContent = `${extraPayoff.years} Years, ${extraPayoff.remainingMonths} Months`;
        extraPaymentInterestElem.textContent = `$${extraPayoff.totalInterest.toFixed(2)}`;
        extraPaymentTotalElem.textContent = `$${extraPayoff.totalPaid.toFixed(2)}`;
    }

    // --- Calculate Savings ---
    let savedInterest = 0;
    let savedMonths = 0;

    // Handle Infinity for savings calculation
    const effectiveMinInterest = (minPayoff.totalInterest === Infinity) ? currentBalance * 100 : minPayoff.totalInterest; // Use a large number if never paid off
    const effectiveExtraInterest = (extraPayoff.totalInterest === Infinity) ? currentBalance * 100 : extraPayoff.totalInterest;
    
    const effectiveMinMonths = (minPayoff.months === Infinity) ? 1200 : minPayoff.months; // Use max months if never paid off
    const effectiveExtraMonths = (extraPayoff.months === Infinity) ? 1200 : extraPayoff.months;

    if (minPayoff.months === Infinity && extraPayoff.months === Infinity) {
        savedInterest = 0;
        savedMonths = 0;
        interestSavedElem.textContent = '$0.00';
        timeSavedElem.textContent = '0 Years, 0 Months';
    } else if (minPayoff.months === Infinity) {
        interestSavedElem.textContent = 'Significant!';
        timeSavedElem.textContent = 'Significant!';
        savedInterest = effectiveMinInterest - effectiveExtraInterest;
        savedMonths = effectiveMinMonths - effectiveExtraMonths;
    } else {
        savedInterest = minPayoff.totalInterest - extraPayoff.totalInterest;
        savedMonths = minPayoff.months - extraPayoff.months;

        interestSavedElem.textContent = `$${Math.max(0, savedInterest).toFixed(2)}`; // Ensure non-negative
        const savedYears = Math.floor(Math.max(0, savedMonths) / 12);
        const savedRemainingMonths = Math.max(0, savedMonths) % 12;
        timeSavedElem.textContent = `${savedYears} Years, ${savedRemainingMonths} Months`;
    }

    // --- Update Charts ---
    // Pass 0 if interest is Infinity for charting purposes
    const chartMinInterest = (minPayoff.totalInterest === Infinity) ? 0 : minPayoff.totalInterest;
    const chartExtraInterest = (extraPayoff.totalInterest === Infinity) ? 0 : extraPayoff.totalInterest;

    updateCharts(currentBalance, chartMinInterest, chartExtraInterest);
    console.log('Chart update initiated.'); // Debugging log
}


// --- Chart Update Function ---
function updateCharts(balance, minInterest, extraInterest) {
    console.log('Updating chart with data:', { balance, minInterest, extraInterest }); // Debugging: Chart data received

    // Destroy existing charts if they exist
    if (currentPaymentChart) {
        currentPaymentChart.destroy();
        currentPaymentChart = null; // Set to null after destruction
    }
    if (extraPaymentChart) { // Use extraPaymentChart here
        extraPaymentChart.destroy();
        extraPaymentChart = null; // Set to null after destruction
    }

    // Function to create or update a pie chart
    function createPieChart(canvasElement, principalAmount, interestAmount) {
        if (!canvasElement) {
            console.error('Canvas element not found for chart.');
            return null;
        }

        // Ensure values are numeric and non-negative
        const dataValues = [
            principalAmount,
            interestAmount
        ].map(val => isFinite(val) ? Math.max(0, val) : 0); // Handle Infinity by setting to 0

        const labels = [
            'Principal Paid',
            'Interest Paid'
        ];
        const backgroundColors = [
            '#007bff', // Blue for Principal
            '#dc3545'  // Red for Interest
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
            // If all values are zero, show a single "No Debt Cost" slice
            filteredData.push(1); // Small dummy value to display a slice
            filteredLabels.push('No Debt Cost');
            filteredColors.push('#CCCCCC');
        }


        return new Chart(canvasElement, {
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
                        position: 'bottom',
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
    }

    // Chart 1: Payoff Breakdown (Current Payment)
    if (balance > 0 || minInterest > 0) {
        currentPaymentChart = createPieChart(currentPaymentChartCanvas, balance, minInterest);
        console.log('Current Payment Chart created.');
    } else {
        const ctx = currentPaymentChartCanvas.getContext('2d');
        ctx.clearRect(0, 0, currentPaymentChartCanvas.width, currentPaymentChartCanvas.height);
        console.log('No data for Current Payment Chart, canvas cleared.');
    }

    // Chart 2: Payoff Breakdown (with Extra Payment)
    if (balance > 0 || extraInterest > 0) {
        extraPaymentChart = createPieChart(extraPaymentChartCanvas, balance, extraInterest);
        console.log('Extra Payment Chart created.');
    } else {
        const ctx = extraPaymentChartCanvas.getContext('2d');
        ctx.clearRect(0, 0, extraPaymentChartCanvas.width, extraPaymentChartCanvas.height);
        console.log('No data for Extra Payment Chart, canvas cleared.');
    }
}


// --- Helper function to reset results and charts on invalid input or zero balance ---
function resetResultsAndCharts() {
    displayMinPaymentElem.textContent = '0.00';
    minPaymentTimeElem.textContent = '0 Years, 0 Months';
    minPaymentInterestElem.textContent = '$0.00';
    minPaymentTotalElem.textContent = '$0.00';

    displayTotalPaymentElem.textContent = '0.00';
    extraPaymentTimeElem.textContent = '0 Years, 0 Months';
    extraPaymentInterestElem.textContent = '$0.00';
    extraPaymentTotalElem.textContent = '$0.00';

    interestSavedElem.textContent = '$0.00';
    timeSavedElem.textContent = '0 Years, 0 Months';

    // Clear charts
    if (currentPaymentChart) {
        currentPaymentChart.destroy();
        currentPaymentChart = null;
    }
    if (extraPaymentChart) {
        extraPaymentChart.destroy();
        extraPaymentChart = null;
    }
    // Manually clear canvas content if charts were not created (e.g., initially)
    currentPaymentChartCanvas.getContext('2d').clearRect(0, 0, currentPaymentChartCanvas.width, currentPaymentChartCanvas.height);
    extraPaymentChartCanvas.getContext('2d').clearRect(0, 0, extraPaymentChartCanvas.width, extraPaymentChartCanvas.height);

    console.log('Results and charts reset.');
}


// --- Event Listeners ---
const debouncedCalculate = debounce(calculateCreditCardPayoff, 500); // Debounce for 500ms

// Attach input listeners to all relevant input fields
currentBalanceInput.addEventListener('input', debouncedCalculate);
annualInterestRateInput.addEventListener('input', debouncedCalculate);
monthlyPaymentInput.addEventListener('input', debouncedCalculate);
extraMonthlyPaymentInput.addEventListener('input', debouncedCalculate);

// Explicit calculate button click (immediate)
calculateBtn.addEventListener('click', calculateCreditCardPayoff);

// Initial calculation on page load
document.addEventListener('DOMContentLoaded', calculateCreditCardPayoff);
