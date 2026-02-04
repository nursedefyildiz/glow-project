import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ message: 'Hata oluştu' });

    const type = Array.isArray(fields.type) ? fields.type[0] : fields.type;
    const alias = Array.isArray(fields.alias) ? fields.alias[0] : fields.alias;
    const message = Array.isArray(fields.message) ? fields.message[0] : fields.message;
    const category = Array.isArray(fields.category) ? fields.category[0] : fields.category;

    const webhookUrl = process.env.DISCORD_WEBHOOK;
    let content = "";

    // Gelen tipine göre mesajı süslüyoruz
    if (type === 'login') {
      content = `**🚪 SİTEYE GİRİŞ YAPILDI**\n\`${alias}\` şu an menü sayfasında! ✨`;
    } else if (type === 'oneri') {
      content = `**🌟 YENİ ÖNERİ**\n**Kategori:** ${category}\n**Eser:** ${message}\n**Öneren:** ${alias}`;
    } else {
      content = `**💌 YENİ MEKTUP**\n**Kimden:** ${alias}\n**Mesaj:** ${message}`;
    }

    const discordPayload = new FormData();
    discordPayload.append("content", content);

    if (files.attachment) {
      const file = Array.isArray(files.attachment) ? files.attachment[0] : files.attachment;
      discordPayload.append("file", fs.createReadStream(file.filepath), {
        filename: file.originalFilename,
        contentType: file.mimetype,
      });
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: discordPayload,
        headers: discordPayload.getHeaders(),
      });
      res.status(response.ok ? 200 : 500).json({ message: 'İşlem tamam!' });
    } catch (e) {
      res.status(500).json({ message: 'Hata!' });
    }
  });
}
