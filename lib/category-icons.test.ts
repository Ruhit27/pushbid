import { describe, expect, it } from "vitest";
import { categoryIcon } from "./category-icons";

describe("categoryIcon", () => {
  it("uses the chosen icon for each seeded Category", () => {
    expect(categoryIcon("marketing-advertising", "Marketing & Advertising")).toBe("megaphone");
    expect(categoryIcon("crypto-web3-investing", "Crypto, Web3 & Investing")).toBe("bitcoin");
    expect(categoryIcon("ai-agents-infrastructure", "AI Agents & Infrastructure")).toBe("bot");
  });

  it("picks an icon from words in the name for Categories added later", () => {
    expect(categoryIcon("music-production", "Music Production")).toBe("music");
    expect(categoryIcon("food-drink", "Food & Drink")).toBe("utensils");
    expect(categoryIcon("pets", "Pet Care")).toBe("paw");
  });

  it("prefers the subject over generic words like tools", () => {
    expect(categoryIcon("health-care-tools", "Health Care Tools")).toBe("heart-pulse");
  });

  it("matches whole words only", () => {
    expect(categoryIcon("carbon", "Carbon Offsets")).not.toBe("car");
  });

  it("falls back to a tag when nothing matches", () => {
    expect(categoryIcon("misc-xyz", "Zyzzyva")).toBe("tag");
  });
});
