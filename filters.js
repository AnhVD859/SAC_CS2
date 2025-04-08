const sharp = require('sharp');

// Grayscale filter
function applyGrayscale(imageBuffer) {
    return sharp(imageBuffer).grayscale().toBuffer();
}

// Blur filter
function applyBlur(imageBuffer, sigma = 5) {
    return sharp(imageBuffer).blur(sigma).toBuffer();
}

// Resize filter
function applyResize(imageBuffer, width = 300, height = 300) {
    return sharp(imageBuffer).resize(width, height).toBuffer();
}

// Brightness Adjustment filter
function applyBrightness(imageBuffer, brightness = 1.2) {
    return sharp(imageBuffer).modulate({ brightness }).toBuffer();
}

module.exports = {
    applyGrayscale,
    applyBlur,
    applyResize,
    applyBrightness
};