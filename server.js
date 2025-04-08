const fetch = require('node-fetch');
global.fetch = fetch;
global.Headers = fetch.Headers;

const express = require('express');
const multer = require('multer');
const amqp = require('amqplib/callback_api');

const app = express();

const fs = require('fs');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'data/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // giữ tên gốc
    }
});
const upload = multer({ storage: storage });

const { startConsumer, DB_FILE_PATH } = require('./rabbit-consumer');
startConsumer();

app.use(express.static('public'));

app.post('/upload', upload.single('image'), (req, res) => {
    const filePath = req.file.path;
    const message = JSON.stringify({ filePath });

    // Gửi message tới RabbitMQ
    amqp.connect('amqp://localhost', (error0, connection) => {
        if (error0) {
            res.status(500).send('Failed to connect to RabbitMQ');
            return;
        }
        connection.createChannel((error1, channel) => {
            if (error1) {
                res.status(500).send('Failed to create RabbitMQ channel');
                return;
            }

            const queue = 'image-processing';

            channel.assertQueue(queue, {
                durable: false
            });

            channel.sendToQueue(queue, Buffer.from(message));
            console.log(" [x] Sent %s", message);

            // Chờ xử lý và kiểm tra kết quả trong db.json
            const checkResult = setInterval(() => {
                try {
                    const db = fs.existsSync(DB_FILE_PATH)
                        ? JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf-8'))
                        : [];

                    const result = db.find(entry => entry.originalFilePath === filePath);

                    if (result) {
                        clearInterval(checkResult);
                        const pdfPath = result.pdfFilePath;
                        return res.download(pdfPath);
                    }
                } catch (err) {
                    clearInterval(checkResult);
                    console.error(err);
                    return res.status(500).send('Error checking db.json');
                }
            }, 1000);
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});