import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ message: 'Form Hatası' });

    // Verileri diziden temizliyoruz
    const type = Array.isArray(fields.type) ? fields.type[0] : fields.type;
    const alias = Array.isArray(fields.alias) ? fields.alias[0] : fields.alias;
    const real_identity = Array.isArray(fields.real_identity) ? fields.real_identity[0] : fields.real_identity;
    const message = Array.isArray(fields.message) ? fields.message[0] : fields.message;
    const category = Array.isArray(fields.category) ? fields.category[0] : fields.category;
    const user_desc = Array.isArray(fields.user_desc) ? fields.user_desc[0] : fields.user_desc;
    const color = Array.isArray(fields.color) ? fields.color[0] : fields.color;

    const webhookUrl = process.env.DISCORD_WEBHOOK;
    let content = "";

    // TRAFİK POLİSİ: Gelen 'type' bilgisine göre Discord mesajını formatlıyoruz
    if (type === 'login') {
      content = `**🚪 SİTEYE GİRİŞ YAPILDI**\n---------------------------\n**👤 Kimlik:** \`${real_identity || alias}\``;
    } 
    else if (type === 'oneri') {
      content = `**🌟 YENİ ÖNERİ**\n---------------------------\n**📂 Kategori:** ${category || 'Belirtilmedi'}\n**👤 Öneren:** \`${alias}\` (Gerçek: ${real_identity})\n**📝 Eser:** ${message}\n**💬 Not:** ${user_desc || 'Açıklama yok'}`;
    } 
    else if (type === 'not') {
      content = `**📌 PANODA YENİ NOT**\n---------------------------\n**👤 Kimlik:** ${real_identity}\n**🎨 Renk:** ${color}\n**📝 Not:** ${message}`;
    } 
    else {
      // Eğer type 'mektup' ise veya belirtilmemişse buraya düşer
      content = `**💌 YENİ MEKTUP**\n---------------------------\n**👤 Gerçek:** ${real_identity}\n**🎭 Takma:** ${alias}\n**📝 Mesaj:** ${message}`;
    }

    const discordPayload = new FormData();
    discordPayload.append("content", content);

    // Fotoğraf eki varsa ekle
    if (files.attachment && files.attachment[0] && files.attachment[0].size > 0) {
      const file = files.attachment[0];
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
      res.status(response.ok ? 200 : 500).json({ message: 'İşlem Başarılı!' });
    } catch (e) {
      res.status(500).json({ message: 'Discorda ulaşılamadı' });
    }
  });
}
