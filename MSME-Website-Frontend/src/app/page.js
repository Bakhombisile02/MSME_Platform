'use client';

import Slider from '../components/home/Slider';
import Categories from '../components/home/Categories';
import AboutSection from '../components/home/AboutSection';

import Partners from '../components/Partners';
import Subscribe from '@/components/Subscribe';
import LatestNews from '@/components/home/LatestNews';

export default function Home () {
  return (
    <main>
      <Slider />
      <Categories />
      <AboutSection />
      <LatestNews />

      <Subscribe />
      <Partners />
    </main>
  );
}