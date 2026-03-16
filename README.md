# 🎨 Ding Dong Doodle

TRY IT OUT HERE: https://ding-dong-doodle.vercel.app/

> A creative platform where kids bring their hand-drawn characters to life, interact with them, and watch them grow over time.

## 💡 Inspiration

Every child draws — stick figures on napkins, crayon monsters on construction paper, pencil heroes in homework margins. These drawings are tiny windows into a child's imagination, but most end up lost in a drawer or thrown away.

Ding Dong Doodle was born from the belief that a child's creativity deserves more than a refrigerator magnet. It deserves a whole world. Children love inventing stories for their toys and drawings — a character can be brave, messy, or learning to share. The stories write themselves, teaching kids lessons about the world along the way.

## ✨ Features

**Draw or Upload:** Sketch directly in the browser or upload a photo of a paper drawing.

**Create Islands:** Build a custom island world for your characters to live in, with customizable environments and scenery.

**Animate Characters:** Bring drawings to life with walking, jumping, waving, and exploring animations.

**Give Personalities:** Assign traits like *brave*, *silly*, *tidy*, or *adventurous* to shape how characters behave and appear in stories.

**Draw Evolutions:** Create new versions of characters over months and years, building a visual timeline of artistic growth.

**Generate Stories:** Get personalized, illustrated short stories starring your own characters, shaped by their unique personalities.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js with canvas based drawing tool |
| Animation | Custom sprite based animation system with CSS transforms |
| AI Story Generation | Cohere (`command-a-reasoning-08-2025`) |
| Backend | Node.js + MongoDB |
| Other | Claude |

## 🏗️ How It Works

1. A child sketches a character in the browser or uploads a photo of their drawing
2. A parent manually assigns a skeleton to the drawing using the rigging tool
3. CSS transforms drive the animation, bringing the character to life
4. Personality traits are assigned to the character
5. The platform feeds the character's name, traits, and a story theme to Cohere, which generates an age-appropriate educational story
6. The character moves around on the child's custom island world

## 🚧 Challenges

**Character segmentation:** The original plan was to use SAM (Segment Anything Model) to automatically split drawings into limbs and torso for animation. Every model tested struggled with accuracy, even on well-drawn characters, producing what the team describes as "hilarious abominations." Given that children's drawings are even rougher, manual skeleton assignment by parents was adopted instead.

**Frontend and backend integration:** Connecting the two halves of the stack took significant debugging time. Several features (including the animation system) had to be rewritten because the backend was prototyped in Python scripts using libraries incompatible with Next.js. The Python logic was ultimately deployed as a separate API.

## 🏆 Accomplishments

A child can go from blank canvas to animated character on a custom island in **under 5 minutes**. The personality driven story engine produces stories that feel genuinely tailored to each character. The evolution timeline is unexpectedly emotional — seeing a character drawn at age 5 next to one drawn at age 8 captures how much children grow. The animation jankiness is, frankly, hilarious. Parents and children both want to use it together, which was a core goal from day one.

## 📖 Lessons Learned

Plan API endpoints in depth before splitting into frontend and backend teams. Sleep is (not) optional.

## 🔮 What's Next

🔊 **Voice narrated stories** read aloud by a warm, friendly AI voice.

🌐 **Multiplayer islands** where kids can visit a friend's island and have their characters interact.

🎵 **Background soundtracks** with ambient audio for each island world.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
