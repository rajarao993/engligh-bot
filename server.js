import express from "express";
import axios from "axios";
import { Telegraf } from "telegraf";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ===============================
   1. COMMAND HANDLER
================================*/
bot.start((ctx) => {
  ctx.reply(`🙏 Welcome ${ctx.from.first_name}!

I am your English learning bot 🇮🇳
Send Telugu text or voice 🎙️`);
});

bot.command("plans", (ctx) => {
  ctx.reply("💳 Plans:\nFree - 5 msgs/day\nPro - ₹999");
});

/* ===============================
   2. TEXT HANDLER
================================*/
bot.on("text", async (ctx) => {
  const userText = ctx.message.text;

  const ai = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are EnglishGuru for Telugu users`
      },
      { role: "user", content: userText }
    ]
  });

  ctx.reply(ai.choices[0].message.content);
});

/* ===============================
   3. VOICE HANDLER (like your n8n)
================================*/
bot.on("voice", async (ctx) => {
  try {
    const fileId = ctx.message.voice.file_id;

    // Get file path
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${file.file_path}`;

    const filePath = `./voice.ogg`;

    // Download
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve) => writer.on("finish", resolve));

    // Transcribe
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "gpt-4o-mini-transcribe"
    });

    const userText = transcription.text;

    // Send to GPT
    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Teach English for Telugu users" },
        { role: "user", content: userText }
      ]
    });

    ctx.reply(ai.choices[0].message.content);

  } catch (err) {
    console.log(err);
    ctx.reply("Error processing voice 😢");
  }
});

const WEBHOOK_URL = "https://your-app-name.onrender.com";

bot.telegram.setWebhook(`${WEBHOOK_URL}/bot`);

app.use(bot.webhookCallback("/bot"));

app.listen(3000, () => {
  console.log("Server running");
});