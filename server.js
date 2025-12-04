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

Your job: Find or CREATE 5 different BRUTALLY SHOCKING opening exchanges (5-6 texts each) that could start this SAME story. These need MAXIMUM WTF and shock factor.

CRITICAL REQUIREMENTS:
1. Use the SAME characters and plot from this script
2. Each exchange is 5-6 texts (mix of me: and them:)
3. Take the MOST SHOCKING, BRUTAL, WTF moments from this story
4. Make viewers go "WHAT THE ACTUAL FUCK?!"
5. Build up the shock - don't reveal everything in first text
6. Let the horror/shock escalate through the exchange

HOW TO MAXIMIZE SHOCK:
- Start with something that makes you pause
- Second text adds confusion/disbelief
- Third text reveals something worse
- Fourth text twists the knife
- Fifth/sixth text makes it UNBEARABLE
- Use explicit language, raw emotions, devastating details
- Make it feel REAL and UNCOMFORTABLE

EXAMPLE FORMAT:
If script is about discovering partner's affair:

"them: we need to talk about last night\\nme: what about it\\nthem: your brother told me everything\\nme: what the fuck did he tell you\\nthem: that you two have been sleeping together\\nme: and you believed him\\nthem: he showed me the videos"

"me: i know what you've been doing\\nthem: what are you talking about\\nme: i installed cameras in the house\\nthem: you're insane\\nme: no but watching you fuck my dad in our bed sure was\\nthem: i can explain"

Make it MENTALLY SCARRING. People should feel uncomfortable but can't look away.

Return EXACTLY 5 exchanges (5-6 texts each) in this JSON format (use \\n for line breaks):
["text1\\ntext2\\ntext3\\ntext4\\ntext5", "text1\\ntext2\\ntext3\\ntext4\\ntext5\\ntext6", ...]`
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
        content: `You are transforming a TikTok texting video script. 

CONTEXT:
- Original script: ${script}
- Selected hook (5-6 text exchange from this story): ${hook}

YOUR TASK:
Transform this script by:

1. Keep the "> conversation with X" header at the top
2. Place the 5-6 text hook exchange RIGHT AFTER the header
3. Continue the story NATURALLY from this opening
4. This hook is FROM this story - it's the most brutal moment repositioned as the opening
5. The rest of the conversation should flow logically from this intense start
6. Make variations:
   - Flip genders (dad→mom, boyfriend→girlfriend, etc.)
   - Change names and small details
   - Vary the wording slightly while keeping the brutal impact
   - Keep the core plot the same

CRITICAL: The hook and the rest of the script should feel like ONE CONTINUOUS CONVERSATION. No awkward transitions. The story starts with this brutal exchange and continues from there seamlessly.

Example structure:
> conversation with [person]
[brutal 5-6 text hook from the story]
[immediate reaction/continuation]
[story develops naturally]
[same plot, same drama, slightly different details]

Return ONLY the transformed script, no explanations.`
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