import { createFileRoute } from "@tanstack/react-router";
import PosterStudio from "@/components/PosterStudio";

export const Route = createFileRoute("/")({
  component: PosterStudio,
  head: () => ({
    meta: [
      { title: "AI Poster Studio — Generate gaming posters from a prompt" },
      {
        name: "description",
        content:
          "Turn a simple idea into cinematic, 4K AI posters for gaming, YouTube thumbnails, and creator key art. Cyberpunk, anime, realistic and cinematic styles.",
      },
    ],
  }),
});
