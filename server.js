const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/generate-hooks', async (req, res) => {
    try {
      const { script } = req.body;
  
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: 'You are a JSON-only API. You must respond ONLY with valid JSON arrays. Never include explanations, markdown formatting, or any text outside the JSON structure.'
        }, {
          role: 'user',
          content: `Generate 5 different attention-grabbing hooks (opening text exchanges) for this TikTok texting video script.
  
  The hooks should be:
  - Shocking or surprising
  - Designed to capture viewer attention immediately
  - Usually 2-4 text messages
  - Different from each other in approach
  
  Here's the original script:
  ${script}
  
  Respond with ONLY a JSON array in this exact format, nothing else:
  ["Hook 1 text here", "Hook 2 text here", "Hook 3 text here", "Hook 4 text here", "Hook 5 text here"]`
        }],
        temperature: 0.8,
        response_format: { type: "json_object" }
      });
  
      let text = completion.choices[0].message.content.trim();
      
      // Remove markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // If OpenAI wrapped it in an object, extract the array
      let parsed = JSON.parse(text);
      let hooks;
      
      if (Array.isArray(parsed)) {
        hooks = parsed;
      } else if (parsed.hooks && Array.isArray(parsed.hooks)) {
        hooks = parsed.hooks;
      } else {
        // Try to find an array in the response
        hooks = Object.values(parsed).find(val => Array.isArray(val)) || [];
      }
  
      res.json({ hooks });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to generate hooks', details: error.message });
    }
  });

app.post('/api/transform-script', async (req, res) => {
  try {
    const { script, hook } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: `You are transforming a TikTok texting video script. I'll give you an original script and a new hook, and you need to transform the entire script while:

1. Starting with the new hook I provide
2. Keeping the core plot and story the same
3. Flipping genders (if dad becomes mom, boyfriend becomes girlfriend, etc.)
4. Changing small details and intricacies to make it feel fresh
5. Maintaining the same conversation format

Original script:
${script}

New hook to start with:
${hook}

Return the complete transformed script in the same format as the original (with > conversation with X < headers and me:/them: format). Return ONLY the script, no explanations.`
      }],
      temperature: 0.7
    });

    const transformedScript = completion.choices[0].message.content;

    res.json({ transformedScript });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to transform script' });
  }
});

module.exports = app;