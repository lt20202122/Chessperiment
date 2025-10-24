import Btn from "./Buttons"

export default function Home() {
  return (
  <><div className="dark:block hidden bg-headerDark h-3"></div>
  <div className="dark:h-1 h-1 w-full bg-gradient-to-b from-headerLight to-light dark:from-headerDark dark:to-dark dark:mb-9"></div>
  <main className="grid grid-cols-2 mt-0">
  <Btn />
  </main>
  </>);
}