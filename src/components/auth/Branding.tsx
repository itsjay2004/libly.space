'use client';

import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import { Dot } from "lucide-react";

const slides = [
  {
    image: "./branding-image/add-info_01.svg",
    title: "Manage Your Library, Smarter",
    description:
      "Track students, payments, membership and seat occupancy in real time — all from one powerful dashboard.",
  },
  {
    image: "./branding-image/productivity_02.svg",
    title: "Save Hours of Your Time",
    description:
      "Seemlessly perform your daily operation, and save 100s of hours of your time.",
  },
  {
    image: "./branding-image/reports_03.svg",
    title: "Made for Indian Study Libraries",
    description:
      "Flexible memberships, fee tracking, and multi-shift support — designed to match how real libraries work.",
  },
  {
    image: "./branding-image/engineer_04.svg",
    title: "Always Know What’s Happening",
    description:
      "Monitor seat usage, active members, due reminder and payments instantly — no more guessing or checking registers.",
  },
  {
    image: "./branding-image/server_05.svg",
    title: "Access Anywhere, Anytime",
    description:
      "All your data are stored securely in the cloud — always protected, always available."
  }
];

export default function Branding() {
  return (
    <div className="hidden lg:flex relative h-screen w-full items-center justify-center overflow-hidden 
      bg-gradient-to-br from-indigo-50 via-white to-purple-50 
      dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
      
      {/* Decorative Background Blobs */}
      <div className="absolute top-[-100px] left-[-150px] w-[400px] h-[400px] bg-purple-300 opacity-30 rounded-full blur-3xl dark:bg-purple-800/40"></div>
      <div className="absolute bottom-[-120px] right-[-150px] w-[400px] h-[400px] bg-indigo-300 opacity-30 rounded-full blur-3xl dark:bg-indigo-800/40"></div>

      {/* Glassmorphic / Frosted Card */}
      <div className="relative z-10 w-full max-w-xl 
        bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 p-8 
        dark:bg-slate-900/60 dark:border-slate-700/50 dark:shadow-2xl">
        
        <Carousel
          className="w-full"
          plugins={[
            Autoplay({
              delay: 4000,
            }),
          ]}
        >
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index}>
                <motion.div
                  className="flex flex-col items-center text-center space-y-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="relative w-80 h-80">
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      className="object-contain drop-shadow-lg dark:drop-shadow-[0_4px_15px_rgba(99,102,241,0.4)]"
                    />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent 
                    dark:from-indigo-400 dark:to-purple-400">
                    {slide.title}
                  </h2>
                  <p className="text-base text-muted-foreground leading-relaxed max-w-md dark:text-slate-300">
                    {slide.description}
                  </p>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Pagination Dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {slides.map((_, i) => (
              <Dot key={i} className="w-4 h-4 text-indigo-400 opacity-70 dark:text-indigo-300/60" />
            ))}
          </div>
        </Carousel>
      </div>
    </div>
  );
}
