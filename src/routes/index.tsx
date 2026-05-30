import { createFileRoute } from "@tanstack/react-router";
import PosterStudio from "@/components/PosterStudio";

export const Route = createFileRoute("/")({
  component: PosterStudio,
  head: () => ({
    meta: [
      { title: "PosterForge AI — Create any poster from your idea" },
      {
        name: "description",
        content:
          "Generate print-ready posters for events, sales, weddings, movies, gaming and more. Add your title, date, location and CTA — AI designs the poster with real legible text.",
      },
    ],
  }),
});
