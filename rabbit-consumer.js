const amqp = require('amqplib/callback_api');
const path = require('path');
const { translate } = require('./utils/translate');
const { ocr } = require('./utils/ocr');
const { createPdf } = require('./utils/pdf');

async function processImage(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
  
    // Áp dụng các filter
    const grayscaleImage = await applyGrayscale(imageBuffer);
    const blurredImage = await applyBlur(grayscaleImage);
  
    // Lưu ảnh đã áp dụng filter tạm thời để OCR
    const tempImagePath = path.join(__dirname, 'data', 'temp.png');
    fs.writeFileSync(tempImagePath, blurredImage);
  
    // Gọi hàm OCR với ảnh đã áp dụng filter
    const text = await image2text(tempImagePath);
  
    // Xóa ảnh tạm thời
    fs.unlinkSync(tempImagePath);
  
    return text;
  }

amqp.connect('amqp://localhost', (error0, connection) => {
    if (error0) {
        throw error0;
    }
    connection.createChannel((error1, channel) => {
        if (error1) {
            throw error1;
        }

        const queue = 'image-processing';

        channel.assertQueue(queue, {
            durable: false
        });

        channel.consume(queue, async (msg) => {
            try {
                const text = await ocr.image2text("./data/sample.png");
                console.log(text);
                const viText = await translate(text);
                console.log(viText);
                const pdfFile = createPDF(viText);
                console.log("This is PDF file: " + pdfFile)
            } catch (e) {
                console.log(e);
            }
            const { filePath } = JSON.parse(msg.content.toString());
            try {
                const text = await ocr.image2text(filePath);
                const translatedText = await translate(text);
                const pdfPath = path.join(__dirname, 'output', `${Date.now()}.pdf`);
                await createPdf(translatedText, pdfPath);
                console.log(`PDF created at ${pdfPath}`);
            } catch (error) {
                console.error('Error processing message', error);
            }
        }, {
            noAck: true
        });
    });
});