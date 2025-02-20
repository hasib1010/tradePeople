// src/app/page.jsx
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Connect with Skilled Tradespeople in Your Area
              </h1>
              <p className="text-xl mb-8">
                Find qualified professionals for your home and business projects or grow your trade business with exclusive leads.
              </p>
              <div className="flex gap-4">
                <Link href="/register">
                  <Button size="lg">Post a Job</Button>
                </Link>
                <Link href="/register-tradesperson">
                  <Button variant="outline" size="lg">Join as Tradesperson</Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <Image 
                src="/assets/images/hero-image.jpg"
                alt="Tradesperson working"
                width={600}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Roofing', 'HVAC', 'Landscaping', 'General Repairs'].map(category => (
              <Link href={`/jobs?category=${category}`} key={category}>
                <div className="bg-white rounded-lg shadow p-6 text-center hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg mb-2">{category}</h3>
                  <p className="text-gray-600 text-sm">Find pros in {category}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Post Your Job</h3>
              <p className="text-gray-600">Describe your project, set your budget, and specify your requirements.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Matched</h3>
              <p className="text-gray-600">Qualified tradespeople in your area will apply for your job.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Hire & Get It Done</h3>
              <p className="text-gray-600">Review applications, select the best match, and complete your project.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}