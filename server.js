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

Create 5 CASUALLY BRUTAL opening exchanges (5-6 texts) that start this story. Make them feel like a REAL conversation where BOTH people are saying shocking things.

CRITICAL RULES:
1. This is the OPENING/SETUP - don't spoil the ending
2. Make it a NATURAL back-and-forth - not just one person freaking out
3. BOTH people should say brutal/shocking things
4. Keep it conversational and casual, which makes it MORE disturbing
5. Could start with a question, statement, or accusation
6. Use the characters from the script

WHAT MAKES IT GOOD:
✅ Back-and-forth dialogue (not one-sided)
✅ Casually brutal (matter-of-fact tone makes it worse)
✅ Both people contribute to the tension
✅ Mix of questions, statements, accusations
✅ Natural conversation flow
✅ Cold, direct, unflinching language

WHAT TO AVOID:
❌ One person saying something shocking, then 5 texts of "what" "huh" "what do you mean"
❌ Over-dramatic reactions
❌ Spoiling the ending
❌ One-sided conversations

EXAMPLES OF GOOD HOOKS:

If story is about cheating/betrayal:
"me: so when were you planning to tell me\\nthem: tell you what\\nme: that you've been fucking my best friend\\nthem: i wasn't planning to\\nme: cool so you were just gonna keep lying\\nthem: it's not like you didn't see it coming"

"them: do you remember what you said at my birthday\\nme: yeah i said happy birthday\\nthem: no you said you'd never leave\\nme: things change\\nthem: so you're really choosing her over me\\nme: i already did weeks ago"

If story is about family drama:
"me: mom knows\\nthem: knows what\\nme: about dad and your mom\\nthem: what the fuck did you tell her\\nme: i didn't have to she found the messages\\nthem: you're lying"

"them: why would you invite him\\nme: because he's my dad\\nthem: he's also the reason mom tried to kill herself\\nme: that was 10 years ago\\nthem: and you're really that fucking stupid\\nme: maybe i am"

See? Both people are saying brutal shit, it flows naturally, and it's casually devastating.

Generate 5 hooks like this from the script above.

Return EXACTLY 5 exchanges in JSON format (use \\n for line breaks):
["text1\\ntext2\\ntext3\\ntext4\\ntext5\\ntext6", ...]`
      }],
      temperature: 0.92
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