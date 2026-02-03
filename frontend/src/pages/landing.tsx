import { Download, Youtube, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center px-6">

      {/* HEADER */}
      <header className="w-full max-w-7xl py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Batch<span className="text-red-500">Tube</span>
        </h1>
        <a
          href="/"
          className="bg-red-500 px-5 py-2 rounded-xl font-medium hover:bg-red-600 transition"
        >
          Launch App
        </a>
      </header>

      {/* HERO SECTION */}
      <section className="mt-20 max-w-3xl text-center">
        <h2 className="text-4xl md:text-6xl font-bold leading-tight">
          Download YouTube Videos  
          <span className="text-red-500"> 10x Faster.</span>
        </h2>
        <p className="mt-6 text-gray-300 text-lg md:text-xl">
          BatchTube lets you download multiple YouTube videos at once — MP3, MP4,  
          full playlists, bulk batches, and ultra-fast parallel ZIP generation.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <a
            href="/"
            className="bg-red-500 px-7 py-3 rounded-xl text-lg font-medium flex items-center gap-2 hover:bg-red-600 transition"
          >
            <Download size={20} /> Start Downloading
          </a>

          <a
            href="#features"
            className="px-7 py-3 rounded-xl border border-gray-600 text-lg font-medium hover:bg-gray-800 transition"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl"
      >
        <div className="bg-[#111] p-6 rounded-xl border border-gray-800">
          <Youtube className="text-red-500" size={35} />
          <h3 className="mt-4 text-xl font-semibold">Playlist Downloader</h3>
          <p className="text-gray-400 mt-2">
            Download full playlists or channels in one click.
          </p>
        </div>

        <div className="bg-[#111] p-6 rounded-xl border border-gray-800">
          <Zap className="text-red-500" size={35} />
          <h3 className="mt-4 text-xl font-semibold">Parallel Engine</h3>
          <p className="text-gray-400 mt-2">
            Ultra-fast parallel downloading powered by our batch engine.
          </p>
        </div>

        <div className="bg-[#111] p-6 rounded-xl border border-gray-800">
          <Download className="text-red-500" size={35} />
          <h3 className="mt-4 text-xl font-semibold">MP3 & MP4</h3>
          <p className="text-gray-400 mt-2">
            Choose your preferred format instantly.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-32 py-10 text-gray-500 text-sm">
        © {new Date().getFullYear()} BatchTube. All rights reserved.
      </footer>
    </div>
  );
}