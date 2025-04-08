const fetch = require('node-fetch');
global.fetch = fetch; 
global.Headers = fetch.Headers;

const amqp = require('amqplib/callback_api');
const express = require('express');
const multer = require('multer');
const path = require('path');
const { translate } = require('./utils/translate');
const { ocr } = require('./utils/ocr');
const { createPdf } = require('./utils/pdf');

const app = express();
const upload = multer({ dest: 'data/' });

app.use(express.static('public'));

// RabbitMQ
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

        app.post('/upload', upload.single('image'), (req, res) => {
            const filePath = req.file.path;
            const message = JSON.stringify({ filePath });

            channel.sendToQueue(queue, Buffer.from(message));
            console.log(" [x] Sent %s", message);
            res.status(202).send('File uploaded and processing started');
        });

        console.log('SERVER: [%s] Waiting for messages in %s', new Date().toLocaleString(), queue);
    });
});

// Consumer run ocr and translate
function startConsumer() {
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

            console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', queue);

            channel.consume(queue, async (msg) => {
                const { filePath } = JSON.parse(msg.content.toString());
                try {
                    const text = await ocr(filePath);
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
}
startConsumer();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});