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

Your job: Create 5 different BRUTAL opening exchanges (5-6 texts each) that START this story with maximum shock - but DON'T spoil the plot or reveal what happens later.

CRITICAL RULES:
1. Use the OPENING/SETUP of this story - the moment that kicks everything off
2. Create the TENSION and DREAD but don't reveal the climax/resolution
3. Each exchange is 5-6 texts (mix of me: and them:)
4. Make viewers go "OH FUCK, where is this going?!"
5. Build anticipation - make them NEED to know what happens
6. Use the SAME characters from the script
7. Focus on the BEGINNING conflict, the initial shock, the setup

WHAT TO EXTRACT:
- The moment something goes wrong
- The initial accusation/confession/reveal
- The setup for the drama
- The "point of no return" moment
- The threat, the ultimatum, the breaking point

WHAT NOT TO REVEAL:
- How it ends
- The final outcome
- Major plot twists that come later
- The resolution or consequences
- Deaths, endings, or final revelations

EXAMPLE:
If story is: Girl breaks up with boy, boy threatens suicide, boy actually does it

GOOD HOOKS (setup only):
"them: babe are you strong enough to watch me go\\nme: what are you talking about\\nthem: i can't do this anymore\\nme: please don't leave me\\nthem: i have to\\nme: i'll end myself if you leave"

"me: you're really doing this\\nthem: yes i am\\nme: after everything we've been through\\nthem: i don't love you anymore\\nme: you'll regret this\\nthem: no i won't"

BAD HOOKS (spoils the ending):
"them: he's dead\\nme: what\\nthem: he actually did it\\nme: oh my god" ❌ SPOILS IT

Generate 5 brutal opening exchanges that hook viewers but DON'T spoil the story.

Return EXACTLY 5 exchanges in JSON format (use \\n for line breaks):
["text1\\ntext2\\ntext3\\ntext4\\ntext5", ...]`
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