import bbLogin from "../assets/BBLogin.png"

type Props = {
  fadeOut?: boolean
}

export default function SplashScreen({ fadeOut = false }: Props) {
  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-black px-4 transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src={bbLogin}
        alt="BudBalance"
        className="w-full max-w-sm rounded-3xl shadow-[0_0_35px_rgba(0,0,0,0.85)]"
      />
    </div>
  )
}