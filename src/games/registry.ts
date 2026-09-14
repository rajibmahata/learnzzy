import { additionGame } from "@/games/addition";
import { subtractionGame } from "@/games/subtraction";

// Active games only (BR-010). Disabled games never appear on /play.
export const GAMES = [
  {
    id: "addition",
    name: "Number Adventure",
    tagline: "Numbers",
    label: "Count juicy red apples! Learn Addition",
    icon: "🔢",
    href: "/play/addition",
    theme: "bg-error-container text-on-error-container shadow-[0_8px_0_#ffb4ab]",
    game: additionGame,
  },
  {
    id: "subtraction",
    name: "Fly Away",
    tagline: "Fly Away",
    label: "Watch friendly birds flap away! Learn Subtraction",
    icon: "🐦",
    href: "/play/subtraction",
    theme: "bg-surface-high text-on-surface shadow-[0_8px_0_#adc6ff]",
    game: subtractionGame,
  },
  {
    id: "clean-up",
    name: "Clean Up",
    tagline: "Clean Up",
    label: "Sort crayons and teddy bears! Spot & Clean",
    icon: "🧹",
    href: "/play/clean-up",
    theme: "bg-tertiary-fixed text-on-tertiary-fixed shadow-[0_8px_0_#4edea3]",
  },
  {
    id: "puzzle",
    name: "Picture Puzzle",
    tagline: "Puzzle",
    label: "Complete the picture! Logic",
    icon: "🧩",
    href: "/play/puzzle",
    theme: "bg-secondary-fixed text-on-secondary-fixed shadow-[0_8px_0_#ffb95f]",
  },
  {
    id: "sketch",
    name: "Shadow Sketch",
    tagline: "Sketch",
    label: "Trace the shape! Create",
    icon: "✏️",
    href: "/play/sketch",
    theme: "bg-surface-container text-on-surface shadow-[0_8px_0_#d5e3fc]",
  },
];
