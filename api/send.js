// api/send.js
import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false, // Dosya yüklemeyi (resim) desteklemek için kapatıyoruz
  },
};

export default async function handler(req, res) {
  // Sadece POST isteklerine izin veriyoruz
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Sadece POST istekleri kabul edilir.' });
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ message: 'Form ayrıştırma hatası oluştu.' });
    }

    // HTML formundan gelen verileri alıyoruz
    // Formidable bazı sürümlerde verileri dizi olarak döndürebilir, bu yüzden [0] kontrolü ekliyoruz
    const alias = Array.isArray(fields.alias) ? fields.alias[0] : fields.alias;
    const real_identity = Array.isArray(fields.real_identity) ? fields.real_identity[0] : fields.real_identity;
    const message = Array.isArray(fields.message) ? fields.message[0] : fields.message;
    
    // Vercel panelinden ekleyeceğin gizli Discord linki
    const webhookUrl = process.env.DISCORD_WEBHOOK;

    if (!webhookUrl) {
      return res.status(500).json({ message: 'Discord Webhook URL bulunamadı. Vercel ayarlarını kontrol et.' });
    }

    const discordPayload = new FormData();
    
    // Discord mesaj içeriği
    const content = `**💌 YENİ MEKTUP (VPN'siz Sistem)**\n` +
                    `---------------------------\n` +
                    `**👤 Gerçek Kimlik:** \`${real_identity}\`\n` +
                    `**🎭 Takma Ad:** \`${alias}\`\n` +
                    `**📝 Mesaj:** ${message}\n` +
                    `---------------------------`;

    discordPayload.append("content", content);

    // Eğer fotoğraf yüklendiyse pakete ekle
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

      if (response.ok) {
        return res.status(200).json({ message: "Başarıyla Discord'a iletildi!" });
      } else {
        const errorText = await response.text();
        return res.status(500).json({ message: "Discord hatası: " + errorText });
      }
    } catch (error) {
      return res.status(500).json({ message: "Sunucu hatası: " + error.message });
    }
  });
}