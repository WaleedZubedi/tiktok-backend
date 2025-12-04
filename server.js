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

Your job: Find or CREATE 5 different BRUTAL 3-text exchanges that could be the OPENING of this SAME story. These exchanges should:

CRITICAL REQUIREMENTS:
1. Use the SAME characters and plot from this script
2. Each exchange is 3 texts (me: and them: format)
3. Take the MOST SHOCKING, BRUTAL moments from this story
4. Make them the OPENING exchange (the hook that grabs attention)
5. These should be moments that make people go "WHAT THE FUCK?!"

HOW TO DO THIS:
- Look at the most dramatic/shocking reveals in the script
- Take those moments and make them the OPENING
- If needed, rephrase them to be even MORE brutal and direct
- Make it feel like we're joining the conversation at the most intense moment

EXAMPLE:
If the script is about someone discovering their partner cheated with their sibling:

Hook 1: "them: i slept with your brother\\nme: what the fuck did you just say\\nthem: and i'm not sorry about it"

Hook 2: "me: i saw you leaving his apartment\\nthem: so what if you did\\nme: you're fucking my brother aren't you"

Hook 3: "them: your brother satisfies me way more than you ever did\\nme: i can't believe this\\nthem: believe it, we've been together for months"

These are all FROM THE SAME STORY but positioned as the opening hook.

Now analyze the script above and generate 5 different brutal 3-text exchanges that could open THIS story.

Return EXACTLY 5 exchanges in this JSON format (use \\n for line breaks):
["text1\\ntext2\\ntext3", "text1\\ntext2\\ntext3", "text1\\ntext2\\ntext3", "text1\\ntext2\\ntext3", "text1\\ntext2\\ntext3"]`
      }],
      temperature: 0.85
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
- Selected hook (3-text exchange from this story): ${hook}

YOUR TASK:
Transform this script by:

1. Keep the "> conversation with X" header at the top
2. Place the 3-text hook exchange RIGHT AFTER the header
3. Continue the story NATURALLY from this opening
4. This hook is FROM this story - it's the most brutal moment repositioned as the opening
5. The rest of the conversation should flow logically from this intense start
6. Make variations:
   - Flip genders (dad→mom, boyfriend→girlfriend, etc.)
   - Change names and small details
   - Vary the wording slightly while keeping the brutal impact
   - Keep the core plot the same

CRITICAL: The hook and the rest of the script should feel like ONE CONTINUOUS CONVERSATION. No awkward transitions. The story starts with this brutal exchange and continues from there.

Example structure:
> conversation with [person]
[brutal 3-text hook from the story]
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