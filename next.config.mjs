 /** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
      domains: [
          'i.ibb.co',
          "res.cloudinary.com",
          "i.ibb.co.com"
      ],
  },
};

export default nextConfig;
