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
        role: 'user',
        content: `You are helping create TikTok texting video scripts. I'll give you a script and you need to generate 5 different attention-grabbing hooks (opening text exchanges) for it.

The hooks should be:
- Shocking or surprising
- Designed to capture viewer attention immediately
- Usually 2-4 text messages
- Different from each other in approach

Here's the original script:
${script}

Return ONLY a JSON array with 5 hooks, each hook being a string. Format:
["Hook 1 text here", "Hook 2 text here", "Hook 3 text here", "Hook 4 text here", "Hook 5 text here"]

Return ONLY the JSON array, no other text.`
      }],
      temperature: 0.8
    });

    const text = completion.choices[0].message.content;
    const cleanText = text.replace(/```json|```/g, '').trim();
    const hooks = JSON.parse(cleanText);

    res.json({ hooks });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate hooks' });
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