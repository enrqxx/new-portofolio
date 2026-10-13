import RoarKnightGame from "@/components/RoarKnightGame";
import BackToHub from "@/components/BackToHub";

export const metadata = {
  title: "THE ROARING KNIGHT — Secret Boss",
};

export default function RoarPage() {
  return (
    <>
      <RoarKnightGame />
      <BackToHub />
    </>
  );
}
