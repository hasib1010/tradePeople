// src/app/page.jsx
"use client"
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { LuHandshake } from "react-icons/lu";
import { FaQuoteLeft, FaRegThumbsUp } from "react-icons/fa";
import { BsShieldCheck } from "react-icons/bs";
import { FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Slider from 'react-slick';


export default function Home() {


  const testimonials = [
    {
      id: 1,
      name: "John Doe",
      occupation: "Software Engineer",
      category: "Trade People",
      review: "This service is fantastic! I’ve never had such a seamless experience.",
      profilePic: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuNhTZJTtkR6b-ADMhmzPvVwaLuLdz273wvQ&s", // Update with actual image path
    },
    {
      id: 2,
      name: "Jane Smith",
      occupation: "Customer",
      category: "Customer",
      review: "The quality of the product is amazing. Highly recommend!",
      profilePic: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuNhTZJTtkR6b-ADMhmzPvVwaLuLdz273wvQ&s", // Update with actual image path
    },
    {
      id: 2,
      name: "Jane Smith",
      occupation: "Customer",
      category: "Customer",
      review: "The quality of the product is amazing. Highly recommend!",
      profilePic: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuNhTZJTtkR6b-ADMhmzPvVwaLuLdz273wvQ&s", // Update with actual image path
    },
    {
      id: 2,
      name: "Jane Smith",
      occupation: "Customer",
      category: "Customer",
      review: "The quality of the product is amazing. Highly recommend!",
      profilePic: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuNhTZJTtkR6b-ADMhmzPvVwaLuLdz273wvQ&s", // Update with actual image path
    },
    {
      id: 2,
      name: "Jane Smith",
      occupation: "Customer",
      category: "Customer",
      review: "The quality of the product is amazing. Highly recommend!",
      profilePic: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuNhTZJTtkR6b-ADMhmzPvVwaLuLdz273wvQ&s", // Update with actual image path
    },
    {
      id: 2,
      name: "Jane Smith",
      occupation: "Customer",
      category: "Customer",
      review: "The quality of the product is amazing. Highly recommend!",
      profilePic: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuNhTZJTtkR6b-ADMhmzPvVwaLuLdz273wvQ&s", // Update with actual image path
    },
    {
      id: 2,
      name: "Jane Smith",
      occupation: "Customer",
      category: "Customer",
      review: "The quality of the product is amazing. Highly recommend!",
      profilePic: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuNhTZJTtkR6b-ADMhmzPvVwaLuLdz273wvQ&s", // Update with actual image path
    },
    // Add more testimonials here
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3, // Default for smaller screens
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024, // For larger screens (lg)
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768, // For medium screens (md)
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480, // For small screens (sm)
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };





  return (
    <main >
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 min-h-screen to-green-700 text-white py-16 relative">
        {/* Background Overlay */}
        {/* <div className="absolute inset-0 bg-black opacity-30"></div> */}

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            {/* Left Content */}
            <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                Connect with Skilled Tradespeople in Your Area
              </h1>
              <p className="text-lg md:text-xl mb-6">
                Find qualified professionals for your home and business projects or grow your trade business with exclusive leads.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">Post a Job</Button>
                </Link>
                <Link href="/register-tradesperson">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Join as Tradesperson
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="md:w-1/2 flex justify-center">
              <Image
                src="/plumber.jpg"
                alt="A skilled tradesperson working on a project"
                width={600}
                height={400}
                className="rounded-lg shadow-lg object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Decorative SVG at the bottom */}
        <div className="w-full absolute -bottom-20">
          <svg
            className="w-full h-auto"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 380"
          >
            <path
              fill="#F9FAFB"
              fillOpacity="1"
              d="M0,96L48,101.3C96,107,192,117,288,133.3C384,149,480,171,576,170.7C672,171,768,149,864,133.3C960,117,1056,107,1152,128C1248,149,1344,203,1392,229.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>


    

      {/* How It Works */}
      <section className="py-16">
        <div className="container max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Post Your Job",
                description: "Describe your project, set your budget, and specify your requirements.",
                src: "/posting.png",
              },
              {
                step: "2",
                title: "Get Matched",
                description: "Qualified tradespeople in your area will apply for your job.",
                src: "/receivr.png",
              },
              {
                step: "3",
                title: "Hire & Get It Done",
                description: "Review applications, select the best match, and complete your project.",
                src: "/contact.png",
              },
            ].map(({ step, title, description, src }) => (
              <div key={step} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
                {/* Step Number */}
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl font-bold">{step}</span>
                </div>

                {/* Image Container */}
                <div className="w-full h-[200px] flex items-center justify-center overflow-hidden  rounded-lg">
                  <Image
                    src={src}
                    alt={title}
                    width={200}
                    height={200}
                    className="object-cover"
                  />
                </div>

                {/* Content */}
                <div className="mt-4">
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-gray-600">{description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
  {/* Featured Categories */}
  <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              "Plumbing",
              "Electrical",
              "Carpentry",
              "Painting",
              "Roofing",
              "HVAC",
              "Landscaping",
              "General Repairs",
            ].map((category) => (
              <Link href={`/jobs?category=${category}`} key={category}>
                <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <h3 className="font-semibold text-lg mb-2">{category}</h3>
                  <p className="text-gray-600 text-sm">Find pros in {category}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* why choose mytradeperson */}
      <section className="py-16">
        <div className="bg-gray-100 text-gray-800 py-16 px-6 md:px-20 ">
          <div className="text-center space-y-4">
            <div className="text-center space-y-4 mb-10">
              <h1 className="text-4xl font-bold text-green-800">
                Why MyTradePerson is Your Trusted Choice
              </h1>
              <p className="max-w-3xl mx-auto text-base ">
                Finding the right tradesperson for your project can be challenging.
                MyTradePerson makes it simple and reliable to connect with trusted
                professionals.
              </p>
              <hr className="w-16 mx-auto mt-2 border-2 border-green-600" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-10 justify-center mt-12 max-w-7xl mx-auto">
            {/* Image Section */}
            <div className="md:w-1/3 w-full">


              <Image
                src="/whyUs.jpg"
                alt="Why Choose Us"
                width={300}
                height={300}
                className="rounded-lg shadow-lg object-cover h-full w-full"
              />

            </div>

            {/* Features Section */}
            <div className="space-y-8 md:w-1/2">
              {/* Feature Card */}
              <div className="flex gap-4 bg-white text-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex-shrink-0 text-green-600">
                  <LuHandshake size={40} />
                </div>
                <div>
                  <h4 className="text-xl font-semibold">The Experts You Need</h4>
                  <p className="text-sm md:text-base mt-2">
                    List your job for free and connect with skilled tradespeople who
                    are ready to help. You decide who to contact and move forward
                    with.
                  </p>
                </div>
              </div>

              {/* Feature Card */}
              <div className="flex gap-4 bg-white text-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex-shrink-0 text-green-600">
                  <FaRegThumbsUp size={40} />
                </div>
                <div>
                  <h4 className="text-xl font-semibold">
                    Honest Customer Feedback
                  </h4>
                  <p className="text-sm md:text-base mt-2">
                    Our detailed review system ensures you can read authentic
                    feedback from real customers, helping you choose the best
                    tradesperson for your needs.
                  </p>
                </div>
              </div>

              {/* Feature Card */}
              <div className="flex gap-4 bg-white text-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex-shrink-0 text-green-600">
                  <BsShieldCheck size={40} />
                </div>
                <div>
                  <h4 className="text-xl font-semibold">Stay in Control</h4>
                  <p className="text-sm md:text-base mt-2">
                    Browse profiles, check work history, and review feedback before
                    making your decision. Only three tradespeople can reach out, and you decide who completes the work.
                  </p>
                </div>
              </div>


              <Link href="/register">
                <Button size="lg" className="bg-green-600  text-white py-2 px-10 mt-4 rounded-sm hover:bg-green-700 transition">Post a Job</Button>
              </Link>

            </div>
          </div>
        </div>
      </section>
      {/* join as trade */}
      <section className="py-16">
        <div className="md:px-20 px-5 py-20 bg-gray-100 text-black">
          <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 p-8 bg-white rounded-xl shadow-lg max-w-7xl mx-auto">

            {/* Image Section */}
            <div className="w-full md:w-1/2">
              <Image
                src="/joinAsTrader.jpg"
                alt="joinAsTrade"
                width={500}
                height={300}
                className="rounded-lg shadow-lg object-cover "
              />
            </div>


            {/* Content Section */}
            <div className="w-full md:w-1/2 space-y-6">
              <h3 className="text-3xl font-semibold text-green-600">Looking for More Work?</h3>
              <p className="text-lg text-gray-700">
                Expand your business with MyTradePerson. Customers can sign up for free and connect with trusted tradespeople. Tradespeople who register will receive a one-month free trial to explore our platform and connect with potential clients.
              </p>

              {/* CTA Button */}
              <button className="text-lg font-semibold text-white bg-gradient-to-r from-green-500 to-green-700 hover:bg-green-800 rounded-lg px-8 py-3 shadow-md hover:shadow-lg transition duration-300">
                Sign up for free
              </button>
            </div>
          </div>
        </div>
      </section>
      <div className="relative  testimonial-carousel  container  py-12 px-4 text-center">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold">What Our Clients Say</h2>
          <hr className="w-20 border-2 border-green-500 mx-auto mt-2" />
        </div>

        <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-gray-100 to-transparent z-10"></div>
        <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-gray-100 to-transparent z-10"></div>
        <div className="max-w-7xl  mx-auto">
          <Slider {...settings}>
            {testimonials.map((testimonial, i) => (
              <div key={i} className="p-5 mr-5 transition-transform transform border ml-10  border-gray-300 bg-white hover:scale-105 hover:bg-gray-100">
                <div className=" mr-5 rounded-lg p-6 space-y-4">
                  <FaQuoteLeft className="text-green-500 text-3xl" />
                  <p className="text-gray-600">{testimonial.review}</p>
                  <div className="flex items-center space-x-4 mt-4">
                    <img
                      src={testimonial?.profilePic}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="text-start">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-semibold">{testimonial.name}</h4> <p className="text-xs">[ {testimonial?.category} ]</p>
                      </div>
                      <p className="text-gray-500">{testimonial.occupation}</p>
                    </div>
                  </div>
                </div>
              </div>

            ))}
          </Slider>
        </div>


      </div>


      <section className="py-16">
        <div className="relative bg-gradient-to-b from-green-100 via-green-300 to-gray-00 py-16 px-8">
          <div className="max-w-7xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold text-gray-800">
              Ready to Take the Next Step?
            </h2>
            <p className="text-lg text-gray-700">
              Join thousands of professionals who are growing their careers and businesses with us.
              Don't miss the chance to be part of something bigger!
            </p>
            <button className="px-8 py-3 text-xl bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-transform">
              Sign up now
            </button>
          </div>

          {/* Decorative Element */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
        </div>
      </section>


      <footer className="bg-gray-800 text-white">


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About Section */}
            <div>
              <h2 className="text-2xl font-semibold">About Us</h2>
              <p className="mt-4 text-sm text-gray-400">
                We connect skilled tradespeople with customers, ensuring quality service and customer satisfaction. Explore our platform for trusted professionals in your area.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h2 className="text-2xl font-semibold">Quick Links</h2>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Services
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Section */}
            <div>
              <h2 className="text-2xl font-semibold">Contact Us</h2>
              <ul className="mt-4 space-y-2">
                <li>
                  <p className="text-sm text-gray-400">
                    Email: support@example.com
                  </p>
                </li>
                <li>
                  <p className="text-sm text-gray-400">
                    Phone: +1 123 456 7890
                  </p>
                </li>
                <li>
                  <p className="text-sm text-gray-400">
                    Address: 123 Trade St., London, UK
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-10 border-t border-gray-700 pt-5 flex flex-col md:flex-row items-center justify-between">
            {/* Logo */}
            <div>
              <h1 className="text-2xl font-bold">TradesConnect</h1>
            </div>

            {/* Social Media Links */}
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition"
              >
                <FaFacebookF size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition"
              >
                <FaTwitter size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition"
              >
                <FaLinkedinIn size={20} />
              </a>
            </div>
          </div>
        </div>

      </footer>
    </main>
  );
}
