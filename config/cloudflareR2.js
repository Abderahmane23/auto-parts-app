// config/cloudflareR2.js
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');

// Configuration du client S3 (compatible R2)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT, // https://ACCOUNT_ID.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'auto-parts-images';
const PUBLIC_URL = process.env.R2_PUBLIC_URL; // https://images.votre-domaine.com

/**
 * Upload une image sur R2 avec génération de thumbnail
 * @param {Buffer} imageBuffer - Buffer de l'image
 * @param {String} filename - Nom du fichier
 * @param {String} folder - Dossier (products, categories, etc.)
 * @returns {Object} - URLs thumbnail et full
 */
async function uploadImage(imageBuffer, filename, folder = 'products') {
  try {
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${filename}`;

    // Générer thumbnail (300x300)
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Optimiser image full (max 1920x1920)
    const fullBuffer = await sharp(imageBuffer)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Upload thumbnail
    const thumbnailKey = `thumbs/${folder}/${uniqueFilename}`;
    await r2Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000', // 1 an
    }));

    // Upload full image
    const fullKey = `images/${folder}/${uniqueFilename}`;
    await r2Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fullKey,
      Body: fullBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000',
    }));

    return {
      thumbnail: `${PUBLIC_URL}/${thumbnailKey}`,
      full: `${PUBLIC_URL}/${fullKey}`,
      keys: {
        thumbnail: thumbnailKey,
        full: fullKey
      }
    };
  } catch (error) {
    console.error('Erreur upload R2:', error);
    throw error;
  }
}

/**
 * Supprimer une image de R2
 * @param {String} key - Clé de l'objet
 */
async function deleteImage(key) {
  try {
    await r2Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));
    return true;
  } catch (error) {
    console.error('Erreur suppression R2:', error);
    return false;
  }
}

/**
 * Générer une URL signée temporaire (pour upload direct depuis frontend)
 * @param {String} key - Clé de l'objet
 * @param {Number} expiresIn - Durée en secondes (défaut: 1h)
 */
async function getPresignedUploadUrl(key, expiresIn = 3600) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: 'image/jpeg',
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Erreur génération URL signée:', error);
    throw error;
  }
}

module.exports = {
  uploadImage,
  deleteImage,
  getPresignedUploadUrl,
  r2Client
};