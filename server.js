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

Generate 5 BRUTALLY SHOCKING opening text exchanges (3 texts each) that will make viewers STOP SCROLLING. These must be:

REQUIREMENTS:
- EXACTLY 3 text messages per hook (a short exchange)
- Mix of "me:" and "them:" messages
- Mentally sickening, brutal, disturbing content
- Each hook should naturally lead into the main story
- The exchange should feel like it's PART of the conversation, not separate
- Make it feel like the conversation is already intense when we join

CRITICAL: These should be EXTREMELY brutal - topics like:
- Infidelity/betrayal with shocking details
- Dark family secrets being exposed
- Life-altering confessions
- Devastating revelations
- Manipulation/gaslighting being called out
- Abuse revelations
- Intense emotional damage

Examples of GOOD 3-text exchanges:

Example 1:
"them: i slept with your brother last night\\nme: you're fucking joking right\\nthem: he said you'd never satisfy me anyway"

Example 2:
"me: i know what you did to sarah\\nthem: you have no proof\\nme: i have the photos and i'm going to the police"

Example 3:
"them: dad's not coming to your wedding\\nme: what why\\nthem: because i told him you're not actually his daughter"

Return EXACTLY 5 three-text exchanges in this JSON format (use \\n for line breaks):
["text1\\ntext2\\ntext3", "text1\\ntext2\\ntext3", "text1\\ntext2\\ntext3", "text1\\ntext2\\ntext3", "text1\\ntext2\\ntext3"]`
      }],
      temperature: 0.95
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
        content: `You are transforming a TikTok texting video script. You will receive an original script and a HOOK (a 3-text exchange that's brutally shocking).

Your task:
1. Keep the "> conversation with X" header at the very top (if it exists)
2. Place the 3-text hook exchange IMMEDIATELY AFTER the header
3. Make the REST of the conversation flow NATURALLY from this brutal opening
4. The hook exchange should feel like it's PART of the conversation, not separate
5. The next texts after the hook should logically continue from this intense moment
6. Keep the core plot and drama the same
7. Flip genders (dad→mom, boyfriend→girlfriend, brother→sister, etc.)
8. Change small details (names, locations, specific details) to make it feel fresh
9. Maintain the dramatic, intense tone throughout

CRITICAL: The conversation should flow smoothly. If the hook ends with someone accusing or revealing something shocking, the next text should be a reaction or continuation, NOT a completely different topic.

Original script:
${script}

Hook exchange to place after the header (this is the opening exchange):
${hook}

STRUCTURE YOUR OUTPUT LIKE THIS:
> conversation with [person]
[3-text hook exchange goes here]
[continue conversation naturally from the shock]
[rest of transformed story]

Make sure:
- Hook is placed RIGHT AFTER the header
- Conversation flows naturally from the hook
- No abrupt topic changes after the hook
- The intensity continues

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