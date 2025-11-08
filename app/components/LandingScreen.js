import Image from 'next/image';

export default function LandingScreen({
  name,
  onNameChange,
  onSubmit,
  creating,
  error,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <main className="flex h-screen w-full items-center justify-center bg-linear-to-b from-[#fdf2ff] to-[#dff3ff] px-4 py-8">
      <div className="flex w-full max-w-xl flex-col items-center gap-8 rounded-[34px] border border-white/70 bg-white/90 px-6 py-8 text-center shadow-[0_32px_90px_rgba(115,88,210,0.22)] md:px-10 md:py-12">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-pink-100/90 to-sky-100/80 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#5a4b81]">
            Welcome to Sperm Buddy
          </span>
          <h1 className="text-3xl font-extrabold text-[#3f3d56] md:text-4xl">
            Hatch Your New Pal
          </h1>
          <p className="max-w-sm text-sm text-[#7b75a2] md:text-base">
            Start the adventure by naming your sperm buddy. Check in daily to keep them happy,
            healthy, and ready for the big race.
          </p>
        </div>

        {/* <div className="relative flex w-full items-center justify-center">
          <div className="absolute h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(175,209,255,0.45)_0%,rgba(255,255,255,0)_70%)] blur-[2px] md:h-80 md:w-80" />
          <Image
            src={neutralSprite}
            alt="New sperm buddy illustration"
            width={240}
            height={240}
            priority
            className="relative h-52 w-52 drop-shadow-[0_20px_40px_rgba(91,79,155,0.28)] md:h-60 md:w-60"
          />
        </div> */}

        <form className="flex w-full flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col items-start gap-2 text-left">
            <label
              htmlFor="sperm-name"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-[#4f4c68]"
            >
              Name Your Buddy
            </label>
            <input
              id="sperm-name"
              type="text"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="e.g. Splash, Bolt, Luna"
              maxLength={24}
              autoComplete="off"
              className="w-full rounded-2xl border border-indigo-200/80 bg-indigo-50/40 px-4 py-3 text-base font-semibold text-[#3f3d56] outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          {error && <p className="text-sm font-semibold text-rose-500">{error}</p>}
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#ff9ebb] via-[#8ec5ff] to-[#95f2ff] px-5 py-4 text-base font-extrabold text-white shadow-[0_20px_35px_rgba(143,173,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_40px_rgba(143,173,255,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={creating}
          >
            {creating ? 'Hatching...' : 'Start the Adventure'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-1 text-sm text-[#776f9a]">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-[#5a4b81]">
            Pro tip
          </span>
          <span>Daily check-ins boost stats and unlock special milestones.</span>
        </div>
      </div>
    </main>
  );
}

