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

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = labelText; // Pre-fill with labelText
        nameInput.placeholder = `e.g., ${labelText}`;
        // Add input event listener for real-time updates
        nameInput.addEventListener('input', calculateNetWorth);


        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.classList.add(`${type}-value`);
        valueInput.value = value;
        valueInput.placeholder = 'Amount ($)';
        valueInput.step = '0.01'; // Allow cents
        // Add input event listener for real-time updates
        valueInput.addEventListener('input', calculateNetWorth);


        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-btn');
        removeBtn.textContent = 'Remove';
        // Use class for initial items instead of inline style for visibility
        if (!removable) {
            removeBtn.classList.add('initial-item');
            removeBtn.textContent = ''; // Clear text for hidden button
        } else {
            removeBtn.addEventListener('click', function() {
                itemDiv.remove();
                calculateNetWorth(); // Recalculate after removing
            });
        }

        itemDiv.appendChild(label);
        itemDiv.appendChild(nameInput);
        itemDiv.appendChild(valueInput);
        itemDiv.appendChild(removeBtn);

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
            const nameInput = item.querySelector('input[type="text"]');
            const valueInput = item.querySelector('.asset-value');
            const value = parseFloat(valueInput.value);
            const name = nameInput.value.trim() || 'Unnamed Asset';

            if (!isNaN(value)) {
                totalAssets += value;
                if (value > 0) { // Only add non-zero values to chart data
                    assetDataForChart.push({ label: name, value: value });
                }
            }
        });

        let totalLiabilities = 0;
        const liabilityDataForChart = [];
        document.querySelectorAll('.liability-item').forEach(item => {
            const nameInput = item.querySelector('input[type="text"]');
            const valueInput = item.querySelector('.liability-value');
            const value = parseFloat(valueInput.value);
            const name = nameInput.value.trim() || 'Unnamed Liability';

            if (!isNaN(value)) {
                totalLiabilities += value;
                if (value > 0) { // Only add non-zero values to chart data
                    liabilityDataForChart.push({ label: name, value: value });
                }
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
        updateChart(assetChart, assetChartCanvas, assetDataForChart, 'Asset Breakdown');
        updateChart(liabilityChart, liabilityChartCanvas, liabilityDataForChart, 'Liability Breakdown');
    }

    // Generic function to update a Chart.js instance
    function updateChart(chartInstance, canvasElement, dataArray, title) {
        const labels = dataArray.map(item => item.label);
        const data = dataArray.map(item => item.value);
        const backgroundColors = data.map(() => getRandomColor());

        if (chartInstance) {
            chartInstance.destroy(); // Destroy previous chart instance
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
            // Clear canvas if no data
            const ctx = canvasElement.getContext('2d');
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }

        // Assign the new chart instance back to the global variable
        if (title === 'Asset Breakdown') {
            assetChart = chartInstance;
        } else if (title === 'Liability Breakdown') {
            liabilityChart = chartInstance;
        }
    }

    // Attach event listeners to initial input fields for real-time updates
    // This is crucial for the pre-existing inputs
    document.querySelectorAll('.asset-value, .liability-value, .asset-item input[type="text"], .liability-item input[type="text"]')
        .forEach(input => {
            input.addEventListener('input', calculateNetWorth);
        });

    // Initial setup of remove button visibility and content for default items on page load
    document.querySelectorAll('.remove-btn[style*="visibility: hidden"]').forEach(button => {
        button.classList.add('initial-item');
        button.textContent = ''; // Ensure no text is visible
        button.style.visibility = ''; // Remove inline style to let CSS class handle it
    });
    // This CSS rule should already be in your <style> block, but ensure it's there
    // If you are injecting it via JS, it's fine, but better in CSS for static pages.
    // document.styleSheets[0].insertRule('.remove-btn.initial-item { display: none; }', 0);


    // Initial calculation on page load
    calculateNetWorth();
});
