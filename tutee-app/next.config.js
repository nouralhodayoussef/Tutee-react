/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "tutee-materials.s3.eu-north-1.amazonaws.com", // AWS S3
      "i.imgur.com", // Imgur (for default tutor profile)
    ],
  },
};

module.exports = nextConfig;
