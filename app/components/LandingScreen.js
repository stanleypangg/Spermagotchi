import { useEffect, useState } from 'react';
import Image from 'next/image';
import petriDish from '@/public/petri.png';
import happyBuddy from '@/public/happier.png';
import splatGif from '@/public/splat.gif';

export default function LandingScreen({
  name,
  onNameChange,
  onSubmit,
  creating,
  error,
  onComplete,
}) {
  const [stage, setStage] = useState('intro'); // intro | fading | form | outro | splat | done
  const [formActive, setFormActive] = useState(false);
  const [showSplat, setShowSplat] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formActive || stage === 'outro' || stage === 'splat' || stage === 'done') {
      return;
    }

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    setFormActive(false);
    setStage('outro');
    await delay(500);

    let success = true;
    if (onSubmit) {
      try {
        const result = await onSubmit();
        success = result !== false;
      } catch (err) {
        success = false;
      }
    }

    if (!success) {
      setStage('form');
      requestAnimationFrame(() => setFormActive(true));
      return;
    }

    await delay(2000);

    setShowSplat(true);
    setStage('splat');

    await delay(4000);

    setShowSplat(false);
    setStage('done');

    if (onComplete) {
      onComplete();
    }
  };


  useEffect(() => {
    let timeout;
    if (stage === 'fading') {
      timeout = setTimeout(() => setStage('form'), 550);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [stage]);

  useEffect(() => {
    if (stage === 'form') {
      const id = requestAnimationFrame(() => setFormActive(true));
      return () => cancelAnimationFrame(id);
    }
    setFormActive(false);
    return undefined;
  }, [stage]);

  const handleBuddyClick = () => {
    if (stage !== 'intro') {
      return;
    }
    setStage('fading');
  };

  const showIntro = stage === 'intro' || stage === 'fading';
  const showForm = stage === 'form' || stage === 'outro';

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.35),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.22),transparent_40%),#f7f8ff] text-[#2d265a]">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -top-32 left-[-15%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(94,234,212,0.18)_0%,rgba(255,255,255,0)_70%)] blur-3xl" />
        <div className="absolute -bottom-40 right-[-15%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.2)_0%,rgba(255,255,255,0)_70%)] blur-3xl" />
      </div>

      {showIntro ? (
        <button
          type="button"
          onClick={handleBuddyClick}
          className={`relative z-10 flex flex-col items-center justify-center rounded-[48px] border border-white/50 bg-white/70 px-12 py-16 text-center shadow-[0_34px_90px_rgba(129,140,248,0.28)] backdrop-blur-xl transition duration-500 ${
            stage === 'intro' ? 'animate-[fadeIn_600ms_ease-out]' : ''
          } ${stage === 'fading' ? 'pointer-events-none scale-95 opacity-0' : 'opacity-100'}`}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(191,219,254,0.55)_0%,rgba(255,255,255,0)_70%)] blur-[2px] md:h-[420px] md:w-[420px]" />
            <Image
              src={petriDish}
              alt="Petri dish"
              width={360}
              height={360}
              priority
              className="absolute bottom-[-60px] h-[280px] w-[280px] opacity-90"
            />
            <Image
              src={happyBuddy}
              alt="Hatched sperm buddy"
              width={380}
              height={380}
              priority
              className="relative h-[330px] w-[330px] animate-[float_6s_ease-in-out_infinite] drop-shadow-[0_36px_80px_rgba(76,29,149,0.28)]"
            />
          </div>
          <p className="mt-12 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">
            Tap to begin
          </p>
        </button>
      ) : showForm ? (
        <div
          className={`relative z-10 flex w-full max-w-xl flex-col gap-6 rounded-[40px] border border-white/60 bg-white/85 px-8 py-10 shadow-[0_32px_110px_rgba(129,140,248,0.25)] backdrop-blur-xl transition-opacity duration-700 ease-out md:px-10 ${
            formActive ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl font-bold text-[#2d265a]">What is your swimmer's name?</h1>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <input
                id="sperm-name"
                type="text"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="e.g. Splash, Bolt, Luna"
                maxLength={24}
                autoComplete="off"
                className="w-full rounded-2xl border border-indigo-200/80 bg-white px-4 py-3 text-base font-semibold text-[#2d265a] outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-200/60"
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-500">
                {error}
              </p>
            ) : null}

            <button
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-base font-bold text-white shadow-[0_20px_40px_rgba(129,140,248,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_52px_rgba(129,140,248,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={creating}
            >
              <span>Go On</span>
              <span
                aria-hidden="true"
                className="translate-y-px transition duration-300 group-hover:translate-x-1"
              >
                ➜
              </span>
            </button>
          </form>
        </div>
      ) : null}

      {showSplat ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
          <Image
            src={splatGif}
            alt="Splat animation"
            width={640}
            height={640}
            unoptimized
            className="w-[640px]"
            style={{ animation: 'none' }}
          />
        </div>
      ) : null}
    </main>
  );
}

