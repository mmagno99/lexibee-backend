require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.VOICE_ID || 'ZF6FPAbjXT4488VcRRnw'; // Amelia British English
const TTS_MODEL_ID = process.env.TTS_MODEL_ID || 'eleven_multilingual_v2'; // Model v2

// Configuración de CORS
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://127.0.0.1:5500'], // **AÑADIR ESTE ORIGEN**
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Ruta para la síntesis de voz
app.post('/synthesize', async (req, res) => {
    const { text, optimize_streaming_latency = 1, output_format = 'mp3_44100_128' } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }
    if (!ELEVENLABS_API_KEY) {
        console.error("Eleven Labs API Key not set.");
        return res.status(500).json({ error: 'Eleven Labs API Key not configured on the server.' });
    }

    try {
        const response = await axios({
            method: 'POST',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            data: {
                text: text,
                model_id: TTS_MODEL_ID,
                voice_settings: {
                    stability: 0.75,
                    similarity_boost: 0.75
                },
                optimize_streaming_latency: optimize_streaming_latency,
                output_format: output_format
            },
            responseType: 'arraybuffer'
        });

        // Convertir el arraybuffer a un buffer de Node.js y luego pasarlo al cliente
            const audioBuffer = Buffer.from(response.data);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.send(audioBuffer); // <--- CAMBIO AQUÍ a res.send

    } catch (error) {
        console.error('Error synthesizing speech with Eleven Labs:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 401) {
            return res.status(401).json({ error: 'Unauthorized: Invalid Eleven Labs API Key' });
        }
        res.status(500).json({ error: 'Failed to synthesize speech' });
    }
});

app.get('/', (req, res) => {
    res.send('LexiBee Eleven Labs TTS Backend is running!');
});

app.listen(PORT, () => {
    console.log(`LexiBee backend listening at http://localhost:${PORT}`);
    console.log(`Eleven Labs VOICE_ID: ${VOICE_ID}, TTS_MODEL_ID: ${TTS_MODEL_ID}`);
});