const args = require('../utils/getArgs.js');
const {PYTHAGORA_API_SERVER} = require("@pythagora.io/js-code-processing").common;
const GeminiAPI = require('./geminiApi');
const { API } = require("@pythagora.io/js-code-processing");

function getApiInstance() {
    const geminiKey = args.gemini_api_key || process.env.GEMINI_API_KEY;
    if (geminiKey && (!args.openai_api_key && !args.pythagora_api_key)) {
        return new GeminiAPI(geminiKey, args.model || 'gemini-2.5-flash');
    }
    const apiUrl = args.pythagora_api_server || PYTHAGORA_API_SERVER;
    const apiKey = args.openai_api_key || args.pythagora_api_key;
    const apiKeyType = args.openai_api_key ? 'openai' : 'pythagora';
    return new API(apiUrl, apiKey, apiKeyType);
}

function getApiConfig() {
    return {
        apiUrl: args.pythagora_api_server || PYTHAGORA_API_SERVER,
        apiKey: args.gemini_api_key || args.openai_api_key || args.pythagora_api_key,
        apiKeyType: args.gemini_api_key ? 'gemini' : (args.openai_api_key ? 'openai' : 'pythagora')
    }
}

module.exports = {getApiConfig, getApiInstance};
