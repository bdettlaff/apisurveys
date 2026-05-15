import Image from "next/image";

export const Logo = ({ width = 36, height = 36 }) => (
  <div className="flex-shrink-0">
    <Image
      src="/assets/brand/qed_edukacja-1.png"
      alt="QUED Edukacja Logo"
      width={width}
      height={height}
      priority
      className="object-contain"
    />
  </div>
);
