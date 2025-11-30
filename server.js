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
          content: 'You return ONLY valid JSON. When asked for an array, return just the array with no wrapper object.'
        }, {
          role: 'user',
          content: `Generate 5 different attention-grabbing hooks for this TikTok script:
  
  ${script}
  
  Return EXACTLY in this format (pure JSON array, no markdown, no explanations):
  ["hook 1", "hook 2", "hook 3", "hook 4", "hook 5"]`
        }],
        temperature: 0.8
      });
  
      let text = completion.choices[0].message.content.trim();
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const hooks = JSON.parse(text);
  
      if (!Array.isArray(hooks) || hooks.length === 0) {
        throw new Error('Invalid response format');
      }
  
      res.json({ hooks });
    } catch (error) {
      console.error('Hook generation error:', error);
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