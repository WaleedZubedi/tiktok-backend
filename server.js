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
        content: 'You return ONLY valid JSON arrays. No markdown, no explanations, no wrapper objects.'
      }, {
        role: 'user',
        content: `Analyze this TikTok texting story script:

${script}

Generate 5 SHOCKING, OUT-OF-POCKET opening text messages that will make viewers STOP SCROLLING. These must be:
- Actual text messages in "me:" or "them:" format
- Brutal, uneasy, and WTF-worthy
- Story-related but attention-grabbing
- The kind of text that makes you go "WAIT, WHAT?!"

Examples of GOOD hooks:
"them: i've been sleeping with your dad for 3 months"
"me: mom i know you're not really my mom"
"them: your sister just confessed everything to me"
"me: i found the DNA test results in your drawer"

Return EXACTLY 5 hooks in this JSON format (pure array, no markdown):
["them: shocking text here", "me: shocking text here", "them: shocking text here", "me: shocking text here", "them: shocking text here"]`
      }],
      temperature: 0.9
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
        content: `You are transforming a TikTok texting video script. You will receive an original script and a HOOK (an opening text message).

Your task:
1. Place the hook text at the VERY TOP of the new script as the opening message
2. Continue the story naturally from that hook
3. Keep the core plot and drama the same
4. Flip genders (dad→mom, boyfriend→girlfriend, brother→sister, etc.)
5. Change small details (names, locations, specific details) to make it feel fresh and unique
6. Maintain the conversation format with "me:" and "them:"
7. Keep the dramatic, intense tone throughout

Original script:
${script}

Hook to start with (place this EXACTLY at the top):
${hook}

Return the complete transformed script starting with the hook. Use the same format as the original (with > conversation with X headers if present, and me:/them: format). Make sure the story flows naturally from the hook opening.

Return ONLY the transformed script, no explanations or notes.`
      }],
      temperature: 0.7
    });

    const transformedScript = completion.choices[0].message.content.trim();

    res.json({ transformedScript });
  } catch (error) {
    console.error('Transform error:', error);
    res.status(500).json({ error: 'Failed to transform script', details: error.message });
  }
});

module.exports = app;