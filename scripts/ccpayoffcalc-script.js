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

    while (remainingBalance > 0 && months < MAX_MONTHS) {
        months++;
        const interestForMonth = remainingBalance * monthlyRate;
        totalInterestPaid += interestForMonth;

        let principalPaidThisMonth = monthlyPaymentAmount - interestForMonth;
        
        // If the remaining balance is less than the principal portion of the payment,
        // adjust the principal paid to only pay off the remaining balance.
        if (remainingBalance < principalPaidThisMonth) {
            principalPaidThisMonth = remainingBalance;
        }

        remainingBalance -= principalPaidThisMonth;

        // If remaining balance is now 0 or negative, we might have overpaid interest slightly
        // or principal was adjusted down for the very last payment.
        // The totalInterestPaid might be slightly off if the *final* payment was less than the full monthly amount
        // due to the balance being fully paid off.
        // For simplicity, we assume the interest calculation `totalInterestPaid` is mostly accurate.
        // A more precise calculation for the last month would involve:
        // interestForLastMonth = (balanceBeforeLastPayment) * monthlyRate;
        // totalInterestPaid = totalInterestPaid - (interestForMonth - interestForLastMonth)
        // However, for typical use cases, the current method is usually sufficient.
    }

    // Final adjustment for totalInterestPaid if balance went negative in the last payment
    // This makes sure interest isn't overcounted if the last payment clears the debt exactly.
    if (remainingBalance < 0 && balance > 0) {
        // Calculate the actual amount paid in the last month
        const lastPaymentAmount = balance + totalInterestPaid;
        const actualLastPayment = Math.min(monthlyPaymentAmount, lastPaymentAmount);
        
        // Recalculate interest for the last portion if necessary
        // This is complex, a simpler approach is to ensure totalPaid is correct
        // and derive interest from that.
        // totalPaid = (months * monthlyPaymentAmount); -- This is only if all payments were full
        // The *actual* total paid might be slightly less than months * monthlyPaymentAmount
        // if the last payment was smaller.
        
        // Simpler way to get total paid if final remainingBalance < 0:
        // totalPaid = (months - 1) * monthlyPaymentAmount + (monthlyPaymentAmount + remainingBalance);
        // This is still tricky with interest.
        
        // Best approach for totalPaid and totalInterestPaid:
        // Total Paid = Initial Balance + Total Interest Paid (accumulated)
        // However, if the last payment was less than full monthlyPaymentAmount,
        // the effective interest from that last partial payment needs careful calculation.
        // Let's stick with the simpler totalInterestPaid accumulator and then:
        // totalPaid = balance + totalInterestPaid.
        // This assumes totalInterestPaid accurately reflects interest only on amounts owed.
        
        // If remainingBalance < 0 means the last `monthlyPaymentAmount` was more than needed,
        // and `totalInterestPaid` might have overcounted the interest for the portion that was overpaid.
        // A direct solution for exact `totalInterestPaid` when balance goes to exactly zero:
        // If balance became zero or less, the actual interest paid is:
        // totalPaid = (months - 1) * monthlyPaymentAmount + (initial balance when month started - interestForMonth);
        // This becomes complex fast.
        
        // A simpler, more robust approach is to let totalInterestPaid accumulate,
        // and totalPaid = balance + totalInterestPaid.
        // If `remainingBalance` is negative, it means the *last* principal component was overpaid.
        // The `totalInterestPaid` is correct *up to* the point where balance was > 0.
        // For the *very last* month, the interest is on the balance *at the beginning of that month*.
        // The principal paid in the last month is `balanceAtStartOfMonth` - `interestForMonth` (up to `monthlyPaymentAmount`).
        // The problem is when `principalPaidThisMonth` would make `remainingBalance` less than 0.
        // In that case, the `totalInterestPaid` should be adjusted for the final partial payment.

        // Correcting totalInterestPaid for the very last payment if it overshoots:
        // The total amount paid is `months * monthlyPaymentAmount`, *unless* the last payment was partial.
        // If the balance becomes 0, the last "payment" might be smaller.
        // To get accurate `totalPaid` and `totalInterest`:
        // If paid off, totalPaid is original balance + total interest.
        // totalInterestPaid is already accumulating.
        // If the `remainingBalance` calculation took it below zero, we need to correct `totalInterestPaid`.
        // The amount overpaid (negative `remainingBalance`) was principal.
        // So, `totalInterestPaid` needs no adjustment *if `principalPaidThisMonth` was correctly capped*.
        // The `principalPaidThisMonth = monthlyPaymentAmount - interestForMonth` line,
        // *then* `if (remainingBalance < 0) remainingBalance = 0;` needs to be used to adjust totalPaid correctly.
        // Let's simplify: `totalPaid` is simply `balance + totalInterestPaid` (assuming `totalInterestPaid` is accurate).
        // The problem comes from `totalInterestPaid += interestForMonth;` even if `remainingBalance` goes below 0.
        // Let's re-think `totalInterestPaid`.

        let tempBalance = balance;
        let accurateTotalInterest = 0;
        let accurateMonths = 0;

        for (let i = 0; i < MAX_MONTHS && tempBalance > 0; i++) {
            accurateMonths++;
            const monthlyInterest = tempBalance * monthlyRate;
            
            // Amount to pay towards principal this month
            let principalPayment = monthlyPaymentAmount - monthlyInterest;

            // If principalPayment is less than 0, it means payment doesn't cover interest.
            if (principalPayment <= 0 && tempBalance > 0 && monthlyRate > 0) {
                return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
            }

            // If the remaining balance is less than the principal payment,
            // we only pay the remaining balance.
            if (tempBalance < principalPayment) {
                principalPayment = tempBalance; // Pay off exactly what's left
            }
            
            accurateTotalInterest += monthlyInterest;
            tempBalance -= principalPayment;
        }

        if (tempBalance > 0) { // If debt still exists after max months
            return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
        }
        
        // Final adjustment to totalInterest if the last payment overshot and principal was adjusted
        // (i.e., `tempBalance` went negative, meaning the last principal payment was actually `(monthlyPaymentAmount + original_negative_tempBalance)` )
        // The accurateTotalInterest includes interest *on the portion paid off*.
        // If the last payment paid off less than `monthlyPaymentAmount` (because balance was low),
        // then the `totalPaid` is actually `(accurateMonths - 1) * monthlyPaymentAmount + (final actual payment)`
        // `final actual payment` = `balance_at_start_of_last_month` + `interest_for_last_month_on_balance`
        // Simplified: The total amount paid is the initial balance plus the accurate total interest.
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

    if (minPayoff.months === Infinity && extraPayoff.months === Infinity) {
        savedInterest = 0;
        savedMonths = 0;
        interestSavedElem.textContent = '$0.00';
        timeSavedElem.textContent = '0 Years, 0 Months';
    } else if (minPayoff.months === Infinity) {
        // Current payment never pays off, but extra payment does - significant savings
        interestSavedElem.textContent = 'Significant!';
        timeSavedElem.textContent = 'Significant!';
        // For chart data, provide a large but finite number to make charts work.
        // The actual value might not be directly comparable, but a large number will show impact.
        savedInterest = currentBalance * annualInterestRate / 100 * 50; // Arbitrary large value
        savedMonths = 1200; // Max months
    } else {
        savedInterest = minPayoff.totalInterest - extraPayoff.totalInterest;
        savedMonths = minPayoff.months - extraPayoff.months;

        interestSavedElem.textContent = `$${Math.max(0, savedInterest).toFixed(2)}`; // Ensure non-negative
        const savedYears = Math.floor(Math.max(0, savedMonths) / 12);
        const savedRemainingMonths = Math.max(0, savedMonths) % 12;
        timeSavedElem.textContent = `${savedYears} Years, ${savedRemainingMonths} Months`;
    }

    // --- Update Charts ---
    updateCharts(currentBalance, minPayoff.totalInterest, extraPayoff.totalInterest);
    console.log('Chart update initiated.'); // Debugging log
}


// --- Chart Update Function ---
function updateCharts(balance, minInterest, extraInterest) {
    console.log('Updating chart with data:', { balance, minInterest, extraInterest }); // Debugging: Chart data received

    // Destroy existing charts if they exist
    if (currentPaymentChart) {
        currentPaymentChart.destroy();
    }
    if (extraPaymentChart) { // Use extraPaymentChart here
        extraPaymentChart.destroy();
    }

    // Function to create or update a pie chart
    function createPieChart(canvasElement, title, principalAmount, interestAmount) {
        if (!canvasElement) {
            console.error('Canvas element not found for chart:', title);
            return null;
        }

        const dataValues = [
            principalAmount,
            interestAmount
        ].map(val => Math.max(0, val)); // Ensure no negative values go into the chart

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
            // If all values are zero, show a single "No Data" slice
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
        currentPaymentChart = createPieChart(currentPaymentChartCanvas, 'Payoff Breakdown (Current Payment)', balance, minInterest);
        console.log('Current Payment Chart created.');
    } else {
        const ctx = currentPaymentChartCanvas.getContext('2d');
        ctx.clearRect(0, 0, currentPaymentChartCanvas.width, currentPaymentChartCanvas.height);
        console.log('No data for Current Payment Chart, canvas cleared.');
    }

    // Chart 2: Payoff Breakdown (with Extra Payment)
    if (balance > 0 || extraInterest > 0) {
        extraPaymentChart = createPieChart(extraPaymentChartCanvas, 'Payoff Breakdown (with Extra Payment)', balance, extraInterest);
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
