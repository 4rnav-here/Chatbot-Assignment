const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Explicitly check for v1 models
        const genAI_v1 = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: 'v1' });

        console.log('--- Checking v1beta Models ---');
        const resultBeta = await genAI.listModels();
        console.log(JSON.stringify(resultBeta, null, 2));

        console.log('\n--- Checking v1 Models ---');
        const resultV1 = await genAI_v1.listModels();
        console.log(JSON.stringify(resultV1, null, 2));

    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
