document.addEventListener('DOMContentLoaded', function() {
    const assetInputsContainer = document.getElementById('assetInputs');
    const liabilityInputsContainer = document.getElementById('liabilityInputs');
    const addAssetBtn = document.getElementById('addAssetBtn');
    const addLiabilityBtn = document.getElementById('addLiabilityBtn');

    const totalAssetsSpan = document.getElementById('totalAssets');
    const totalLiabilitiesSpan = document.getElementById('totalLiabilities');
    const netWorthSpan = document.getElementById('netWorth');

    const assetChartCanvas = document.getElementById('assetChart');
    const liabilityChartCanvas = document.getElementById('liabilityChart');

    let assetChart; // To hold the Chart.js instance for assets
    let liabilityChart; // To hold the Chart.js instance for liabilities

    // Helper to Generate Random Colors for Chart
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    // Function to create a new input row (reusable for assets and liabilities)
    function createInputRow(type, labelText = '', value = '', removable = true) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add(`${type}-item`);

        const label = document.createElement('label');
        label.textContent = labelText;

        const inputGroup = document.createElement('div'); // Container for inputs and link
        inputGroup.classList.add('input-group');

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = labelText; // Pre-fill with labelText
        nameInput.placeholder = `e.g., ${labelText}`;
        nameInput.addEventListener('input', calculateNetWorth);

        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.classList.add(`${type}-value`);
        valueInput.value = value;
        valueInput.placeholder = 'Amount ($)';
        valueInput.step = '0.01'; // Allow cents
        valueInput.addEventListener('input', calculateNetWorth);

        inputGroup.appendChild(nameInput);
        inputGroup.appendChild(valueInput);

        const removeLink = document.createElement('a');
        removeLink.href = '#'; // Prevent page jump
        removeLink.classList.add('remove-link');
        removeLink.textContent = 'Remove';
        if (!removable) {
            removeLink.style.display = 'none'; // Hide for initial items
        } else {
            removeLink.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent link navigation
                itemDiv.remove();
                calculateNetWorth(); // Recalculate after removing
            });
        }
        
        itemDiv.appendChild(label);
        itemDiv.appendChild(inputGroup);
        // CRITICAL FIX: Append the removeLink *after* the inputGroup, but still within itemDiv.
        // The CSS for .asset-item and .liability-item being `flex-direction: column`
        // will naturally stack them.
        itemDiv.appendChild(removeLink); 

        return itemDiv;
    }

    // Add Asset/Liability Row Functions
    addAssetBtn.addEventListener('click', function() {
        assetInputsContainer.appendChild(createInputRow('asset', 'New Asset', 0, true));
        calculateNetWorth(); // Recalculate after adding
    });

    addLiabilityBtn.addEventListener('click', function() {
        liabilityInputsContainer.appendChild(createInputRow('liability', 'New Liability', 0, true));
        calculateNetWorth(); // Recalculate after adding
    });

    // Function to calculate net worth and update charts
    function calculateNetWorth() {
        let totalAssets = 0;
        const assetDataForChart = [];
        document.querySelectorAll('.asset-item').forEach(item => {
            const nameInput = item.querySelector('.input-group input[type="text"]');
            const valueInput = item.querySelector('.asset-value');
            const value = parseFloat(valueInput.value);
            const name = nameInput.value.trim() || 'Unnamed Asset';

            if (!isNaN(value) && value !== 0) {
                totalAssets += value;
                assetDataForChart.push({ label: name, value: value });
            }
        });

        let totalLiabilities = 0;
        const liabilityDataForChart = [];
        document.querySelectorAll('.liability-item').forEach(item => {
            const nameInput = item.querySelector('.input-group input[type="text"]');
            const valueInput = item.querySelector('.liability-value');
            const value = parseFloat(valueInput.value);
            const name = nameInput.value.trim() || 'Unnamed Liability';

            if (!isNaN(value) && value !== 0) {
                totalLiabilities += value;
                liabilityDataForChart.push({ label: name, value: value });
            }
        });

        const netWorth = totalAssets - totalLiabilities;

        // Display results
        totalAssetsSpan.textContent = `$${totalAssets.toFixed(2)}`;
        totalLiabilitiesSpan.textContent = `$${totalLiabilities.toFixed(2)}`;
        netWorthSpan.textContent = `$${netWorth.toFixed(2)}`;

        // Apply color based on net worth
        netWorthSpan.classList.remove('positive', 'negative');
        if (netWorth >= 0) {
            netWorthSpan.classList.add('positive');
        } else {
            netWorthSpan.classList.add('negative');
        }

        // Update Charts
        assetChart = updateChart(assetChart, assetChartCanvas, assetDataForChart, 'Asset Breakdown');
        liabilityChart = updateChart(liabilityChart, liabilityChartCanvas, liabilityDataForChart, 'Liability Breakdown');
    }

    // Generic function to update a Chart.js instance
    function updateChart(chartInstance, canvasElement, dataArray, title) {
        const labels = dataArray.map(item => item.label);
        const data = dataArray.map(item => item.value);
        const backgroundColors = data.map(() => getRandomColor());

        if (chartInstance) {
            chartInstance.destroy();
        }

        if (data.length > 0) {
            chartInstance = new Chart(canvasElement, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        title: {
                            display: true,
                            text: title,
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });
        } else {
            const ctx = canvasElement.getContext('2d');
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            chartInstance = null;
        }
        return chartInstance;
    }

    // Attach event listeners to initial input fields for real-time updates
    document.querySelectorAll('.asset-item input, .liability-item input')
        .forEach(input => {
            input.addEventListener('input', calculateNetWorth);
        });

    // Initial setup for default items (hiding the remove link for them)
    // We'll hide the remove links for the first few pre-defined items.
    document.querySelectorAll('#assetInputs .asset-item .remove-link').forEach((link, index) => {
        // Assuming the first 5 items are the initial ones provided in the HTML
        if (index < 5) {
            link.style.display = 'none';
        }
        link.addEventListener('click', function(e) {
            e.preventDefault();
            link.closest('.asset-item').remove();
            calculateNetWorth();
        });
    });

    document.querySelectorAll('#liabilityInputs .liability-item .remove-link').forEach((link, index) => {
        // Assuming the first 4 items are the initial ones provided in the HTML
        if (index < 4) {
            link.style.display = 'none';
        }
        link.addEventListener('click', function(e) {
            e.preventDefault();
            link.closest('.liability-item').remove();
            calculateNetWorth();
        });
    });

    // Initial calculation on page load
    calculateNetWorth();
});
