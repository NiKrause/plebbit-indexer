import Image from "next/image";

export default function SeeditLogo() {
  return (
    <Image
      src="/plebbit-logo.png" // or .png if that's what you saved
      alt="Plebbit   Logo"
      width={40}
      height={40}
    />
  );
}