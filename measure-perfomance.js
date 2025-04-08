const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { applyGrayscale, applyBlur, applyResize, applyBrightness } = require('./filters');

const imagePath = path.join(__dirname, 'data', 'sample.png');
const imageBuffer = fs.readFileSync(imagePath);

async function measurePerformance(filterFunction, imageBuffer) {
    const start = performance.now();
    await filterFunction(imageBuffer);
    const end = performance.now();
    const elapsed = end - start; // Time in milliseconds
    return elapsed;
}

const filters = [
    { name: 'Grayscale', function: applyGrayscale },
    { name: 'Blur', function: applyBlur },
    { name: 'Resize', function: applyResize },
    { name: 'Brightness Adjustment', function: applyBrightness }
];

(async () => {
    const results = [];
    for (const filter of filters) {
        const time = await measurePerformance(filter.function, imageBuffer);
        console.log(`${filter.name} filter took ${time.toFixed(2)} ms`);
        results.push({ name: filter.name, time: time.toFixed(2) });
    }

    const reportPath = path.join(__dirname, 'performance', 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`Performance report saved to ${reportPath}`);
})();