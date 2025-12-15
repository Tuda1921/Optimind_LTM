import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getUserIdFromCookie(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const userCookie = cookie.split(";").find((c) => c.trim().startsWith("user_data="));
  if (!userCookie) return null;
  try {
    const value = decodeURIComponent(userCookie.split("=")[1]);
    const user = JSON.parse(value);
    return user.id;
  } catch {
    return null;
  }
}

// POST /api/gamification/pet/interact - Interact with pet (feed, play, etc.)
export async function POST(req: Request) {
  try {
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, itemId } = body;

    if (!action || !["feed", "play", "clean"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be feed, play, or clean" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Get pet
      let pet = await tx.pet.findUnique({
        where: { userId },
      });

      if (!pet) {
        pet = await tx.pet.create({
          data: {
            userId,
            name: "My Pet",
            type: "cat",
          },
        });
      }

      // If feeding, check inventory and consume item
      if (action === "feed" && itemId) {
        const inventoryItem = await tx.inventory.findFirst({
          where: {
            userId,
            itemId,
            quantity: { gt: 0 },
          },
          include: {
            item: true,
          },
        });

        if (!inventoryItem) {
          throw new Error("Item not found in inventory");
        }

        if (inventoryItem.item.category !== "food") {
          throw new Error("Item is not food");
        }

        // Consume item
        await tx.inventory.update({
          where: { id: inventoryItem.id },
          data: {
            quantity: { decrement: 1 },
          },
        });

        // Increase hunger
        pet = await tx.pet.update({
          where: { userId },
          data: {
            hunger: Math.min(pet.hunger + 20, 100),
            lastFed: new Date(),
          },
        });
      } else if (action === "play") {
        // Increase happiness, decrease energy
        pet = await tx.pet.update({
          where: { userId },
          data: {
            happiness: Math.min(pet.happiness + 15, 100),
            energy: Math.max(pet.energy - 10, 0),
          },
        });
      } else if (action === "clean") {
        // Increase happiness slightly
        pet = await tx.pet.update({
          where: { userId },
          data: {
            happiness: Math.min(pet.happiness + 5, 100),
          },
        });
      }

      return pet;
    });

    return NextResponse.json({ pet: result });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Failed to interact with pet" },
      { status: 500 }
    );
  }
}
