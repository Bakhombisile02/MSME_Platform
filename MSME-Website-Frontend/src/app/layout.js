import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from "@/context/AuthContext";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "MSME",
  description: "MSME platform - Empowering Micro, Small and Medium Enterprises",
  keywords: "MSME, business, small business, medium enterprise",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/images/logo_msme.png" />
      </head>
      <body
        className={`${montserrat.variable} font-montserrat antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <Header />
          <main className="mt-24">
            <div className="max-w-[120rem]   mx-auto">
              {children}
            </div>
          </main>
          <Footer />
        </AuthProvider>
        <Toaster 
          position="top-right"
          containerStyle={{
            top: '100px',
            right: '20px',
          }}
          reverseOrder={true}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: '#4aed88',
              },
            },
            error: {
              duration: 3000,
              theme: {
                primary: '#ff4b4b',
              },
            },
          }}
        />
      </body>
    </html>
  );
}