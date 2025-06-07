import Image from "next/image";

export default function PlebscanLogo() {
  return (
    <Image
      src="/plebscan-logo.png" // or .png if that's what you saved
      alt="Plebscan Logo"
      width={40}
      height={40}
    />
  );
}