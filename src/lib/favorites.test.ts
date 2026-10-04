// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { getFavoriteIds, isFavorite, toggleFavorite } from "./favorites";

beforeEach(() => {
  localStorage.clear();
});

describe("favorites", () => {
  it("starts with nothing favorited", () => {
    expect(isFavorite("let-it-be")).toBe(false);
    expect(getFavoriteIds()).toEqual([]);
  });

  it("toggling on returns true and persists it", () => {
    expect(toggleFavorite("let-it-be")).toBe(true);
    expect(isFavorite("let-it-be")).toBe(true);
    expect(getFavoriteIds()).toEqual(["let-it-be"]);
  });

  it("toggling again returns false and removes it", () => {
    toggleFavorite("let-it-be");
    expect(toggleFavorite("let-it-be")).toBe(false);
    expect(isFavorite("let-it-be")).toBe(false);
    expect(getFavoriteIds()).toEqual([]);
  });

  it("keys by stable id, not title — two different ids never collide", () => {
    toggleFavorite("wonderwall");
    toggleFavorite("custom-abc123");
    expect(getFavoriteIds().sort()).toEqual(["custom-abc123", "wonderwall"]);
    expect(isFavorite("wonderwall")).toBe(true);
    expect(isFavorite("custom-abc123")).toBe(true);
  });

  it("survives a fresh read (simulating a page refresh)", () => {
    toggleFavorite("riptide");
    // getFavoriteIds always re-reads from localStorage rather than
    // caching in memory, so this stands in for "refresh the page".
    expect(getFavoriteIds()).toContain("riptide");
  });
});
