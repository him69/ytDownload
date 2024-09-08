const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
app.use(cors());

// Set the path to FFmpeg binary
const ffmpegPath = 'E:\\ffmpeg\\bin\\ffmpeg.exe';
ffmpeg.setFfmpegPath(ffmpegPath);

// Generate a random file name
function generateRandomFileName(extension) {
    return `${crypto.randomBytes(8).toString('hex')}.${extension}`;
}

app.get('/download', (req, res) => {
    const { url } = req.query;

    if (!ytdl.validateURL(url)) {
        return res.status(400).send('Invalid URL');
    }

    const videoFileName = generateRandomFileName('mp4');
    const audioFileName = generateRandomFileName('mp4');
    const outputFileName = generateRandomFileName('mp4');

    const videoFile = path.join(__dirname, videoFileName);
    const audioFile = path.join(__dirname, audioFileName);
    const outputFile = path.join(__dirname, outputFileName);

    // Download video
    const videoStream = ytdl(url, {
        quality: 'highestvideo',
        requestOptions: {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
        }
    }).pipe(fs.createWriteStream(videoFile));

    videoStream.on('finish', () => {
        // Download audio
        const audioStream = ytdl(url, {
            quality: 'highestaudio',
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                },
            }
        }).pipe(fs.createWriteStream(audioFile));

        audioStream.on('finish', () => {
            // Merge video and audio
            ffmpeg()
                .input(videoFile)
                .input(audioFile)
                .audioCodec('aac')
                .videoCodec('copy')
                .format('mp4')
                .on('end', () => {
                    res.writeHead(200, {
                        'Content-Type': 'video/mp4',
                        'Content-Disposition': `attachment; filename=${outputFileName}`
                    });

                    // Stream the merged file to the client
                    const readStream = fs.createReadStream(outputFile);
                    readStream.pipe(res);

                    readStream.on('end', () => {
                        // Cleanup temporary files after sending
                        fs.unlink(videoFile, () => {});
                        fs.unlink(audioFile, () => {});
                        fs.unlink(outputFile, () => {});
                    });
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    res.status(500).send('Error processing the request');
                })
                .save(outputFile);
        });

        audioStream.on('error', (err) => {
            console.error('Audio stream error:', err);
            res.status(500).send('Error downloading audio');
        });
    });

    videoStream.on('error', (err) => {
        console.error('Video stream error:', err);
        res.status(500).send('Error downloading video');
    });

    // Handle client disconnection
    req.on('close', () => {
        res.end();
        fs.unlink(videoFile, () => {});
        fs.unlink(audioFile, () => {});
        fs.unlink(outputFile, () => {});
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
