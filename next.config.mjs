 /** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
      domains: [
          'i.ibb.co',
          "res.cloudinary.com"
      ],
  },
};

export default nextConfig;
