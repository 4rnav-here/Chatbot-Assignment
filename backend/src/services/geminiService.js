// =============================================================================
// GEMINI SERVICE
// =============================================================================
// This service handles all interactions with the Google Gemini API.
// It wraps the API calls in a clean interface that the rest of the app can use.
//
// GOOGLE GEMINI:
// - Gemini is Google's family of AI models (similar to GPT)
// - We use the @google/generative-ai package to interact with it
// - The API requires an API key from Google AI Studio
//
// HOW CONVERSATION WORKS:
// 1. We send a system prompt (defines AI personality/role)
// 2. We send conversation history (previous messages)
// 3. Gemini generates a response based on context
// =============================================================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

// =============================================================================
// INITIALIZE GEMINI CLIENT
// =============================================================================
// Create a client instance with our API key.
// The API key is loaded from environment variables for security.
// =============================================================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =============================================================================
// GET GENERATIVE MODEL
// =============================================================================
// Gemini has different models for different tasks:
// - gemini-1.5-flash: Fast, good for chat (what we use)
// - gemini-1.5-pro: More capable, slower
// - gemini-pro-vision: Can understand images
//
// We use gemini-1.5-flash for chat because it's fast and cost-effective.
// =============================================================================
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    // Safety settings (optional - can adjust based on use case)
    safetySettings: [
        {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
    ]
});

// =============================================================================
// GENERATE RESPONSE
// =============================================================================
// Main function to generate AI responses.
//
// Parameters:
// - systemPrompt: Instructions that define the AI's behavior
//   Example: "You are a helpful cooking assistant. Only answer cooking questions."
// - conversationHistory: Array of previous messages in the format:
//   [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi!' }]
//
// Returns:
// - The AI's response text
//
// HOW IT WORKS:
// 1. Start a chat session with the model
// 2. Format the history for Gemini's API format
// 3. Send the last user message with context
// 4. Return the generated response
// =============================================================================
const generateResponse = async (systemPrompt, conversationHistory) => {
    try {
        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        // Format conversation history for Gemini
        // Gemini expects: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
        // We store: [{ role: 'user' | 'assistant', content: '...' }]
        const formattedHistory = conversationHistory.slice(0, -1).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Get the last message (the one we're responding to)
        const lastMessage = conversationHistory[conversationHistory.length - 1];

        // Start a chat session
        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 2048,    // Maximum response length
                temperature: 0.7,         // Creativity (0 = focused, 1 = creative)
                topP: 0.8,               // Nucleus sampling
                topK: 40,                // Top-k sampling
            }
        });

        // Build the prompt with system instructions
        // We prepend the system prompt to give context
        const promptWithSystem = systemPrompt
            ? `[System: ${systemPrompt}]\n\nUser: ${lastMessage.content}`
            : lastMessage.content;

        // Generate response
        const result = await chat.sendMessage(promptWithSystem);
        const response = await result.response;
        const text = response.text();

        return text;

    } catch (error) {
        console.error('Gemini API Error:', error.message);

        // Provide helpful error messages
        if (error.message.includes('API_KEY')) {
            throw new Error('GEMINI: Invalid API key. Please check your GEMINI_API_KEY.');
        }

        if (error.message.includes('quota')) {
            throw new Error('GEMINI: API quota exceeded. Please try again later.');
        }

        if (error.message.includes('safety')) {
            throw new Error('GEMINI: Response blocked due to safety settings.');
        }

        throw new Error(`GEMINI: ${error.message}`);
    }
};

// =============================================================================
// EXPORT SERVICE
// =============================================================================
module.exports = {
    generateResponse
};
