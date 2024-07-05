import React from "react";
import { motion } from "framer-motion";
import "tailwindcss/tailwind.css";

const App = () => {
  return (
    <div className="h-screen w-screen overflow-auto font-sans text-gray-900 antialiased">
      <Header />
      <HeroSection />
      <TestimonialsSection />
      <SignUpSection />
      <Footer />
    </div>
  );
};

const Header = () => {
  return (
    <header className="bg-blue-600 p-4 text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-2xl font-bold">YourApp</div>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <a href="#hero" className="hover:underline">
                Home
              </a>
            </li>
            <li>
              <a href="#testimonials" className="hover:underline">
                Testimonials
              </a>
            </li>
            <li>
              <a href="#signup" className="hover:underline">
                Sign Up
              </a>
            </li>
            <li>
              <a href="#footer" className="hover:underline">
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

const HeroSection = () => {
  return (
    <motion.section
      id="hero"
      className="flex h-screen flex-col items-center justify-center bg-blue-100 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <h1 className="mb-4 text-5xl font-bold">Welcome to YourApp</h1>
      <p className="mb-8 text-xl">
        YourApp makes your life easier. Join us and make the most of your time!
      </p>
      <a
        href="#signup"
        className="rounded-full bg-blue-600 px-6 py-3 text-white shadow-md hover:bg-blue-700"
      >
        Get Started
      </a>
    </motion.section>
  );
};

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="h-screen bg-white py-16">
      <div className="container mx-auto text-center">
        <h2 className="mb-8 text-3xl font-bold">What Our Users Say</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Testimonial
            frontContent={
              <>
                <p className="mb-4 italic">
                  &quot;This app changed my life!&quot;
                </p>
                <h3 className="font-bold">John Doe</h3>
              </>
            }
            backContent={
              <>
                <p className="mb-4 italic">
                  &quot;Highly recommended to everyone.&quot;
                </p>
                <h3 className="font-bold">John Doe</h3>
              </>
            }
          />
          <Testimonial
            frontContent={
              <>
                <p className="mb-4 italic">
                  &quot;Incredible experience, highly recommend!&quot;
                </p>
                <h3 className="font-bold">Jane Smith</h3>
              </>
            }
            backContent={
              <>
                <p className="mb-4 italic">
                  &quot;A must-have for anyone looking to improve their
                  productivity.&quot;
                </p>
                <h3 className="font-bold">Jane Smith</h3>
              </>
            }
          />
          <Testimonial
            frontContent={
              <>
                <p className="mb-4 italic">
                  &quot;A must-have for anyone looking to improve their
                  productivity.&quot;
                </p>
                <h3 className="font-bold">Sam Wilson</h3>
              </>
            }
            backContent={
              <>
                <p className="mb-4 italic">
                  &quot;An essential tool in my daily workflow.&quot;
                </p>
                <h3 className="font-bold">Sam Wilson</h3>
              </>
            }
          />
        </div>
      </div>
    </section>
  );
};

const Testimonial = ({ frontContent, backContent }) => {
  return (
    <div className="perspective relative h-96 w-64">
      <motion.div
        className="absolute h-full w-full rounded-lg shadow-md"
        initial={{ rotateY: 0 }}
        whileHover={{ rotateY: 180 }}
        transition={{ duration: 0.6 }}
      >
        <CardSide
          className="absolute inset-0 bg-gray-100 p-8"
          content={frontContent}
        />
        <CardSide
          className="absolute inset-0 bg-blue-100 p-8"
          content={backContent}
          isBack
        />
      </motion.div>
    </div>
  );
};

const CardSide = ({ className, content, isBack = false }) => {
  return (
    <motion.div
      className={`${className} backface-hidden rounded-lg`}
      initial={{ rotateY: isBack ? 180 : 0 }}
      animate={{ rotateY: isBack ? 180 : 0 }}
    >
      {content}
    </motion.div>
  );
};

const SignUpSection = () => {
  return (
    <section id="signup" className="h-screen bg-blue-50 py-16">
      <div className="container mx-auto text-center">
        <h2 className="mb-8 text-3xl font-bold">Choose Your Plan</h2>
        <div className="flex flex-col items-center justify-center space-y-8 md:flex-row md:space-x-8 md:space-y-0">
          <PricingCard
            title="Monthly Plan"
            price="$10/month"
            description="Billed monthly"
          />
          <PricingCard
            title="Annual Plan"
            price="$100/year"
            description="Billed annually, save 17%"
          />
        </div>
      </div>
    </section>
  );
};

const PricingCard = ({ title, price, description }) => {
  return (
    <motion.div
      className="w-full rounded-lg bg-white p-8 shadow-md md:w-1/3"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <h3 className="mb-4 text-2xl font-bold">{title}</h3>
      <p className="mb-2 text-4xl font-bold">{price}</p>
      <p className="mb-4 text-gray-700">{description}</p>
      <button className="rounded-full bg-blue-600 px-6 py-3 text-white shadow-md hover:bg-blue-700">
        Sign Up
      </button>
    </motion.div>
  );
};

const Footer = () => {
  return (
    <footer
      id="footer"
      className="bg-footer-image h-[66vh] bg-blue-600 bg-cover bg-bottom bg-no-repeat py-8 text-white"
    >
      <div className="container mx-auto text-center">
        <p className="mb-4">© 2024 YourApp. All rights reserved.</p>
        <p>Contact us: info@yourapp.com</p>
      </div>
    </footer>
  );
};

export default App;
