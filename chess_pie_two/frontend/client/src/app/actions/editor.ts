"use server";

import { auth } from "@/auth";
import { migrateUserData, hasUserMigrated } from "@/lib/firestore";
import { revalidatePath } from "next/cache";

/**
 * Server action to trigger lazy data migration for the authenticated user.
 * This runs on the server using the Firebase Admin SDK.
 */
export async function migrateUserAction() {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
        throw new Error("Unauthorized: No user session found during migration");
    }

    try {
        console.log(`Checking migration doc for user: ${userId}`);
        const alreadyMigrated = await hasUserMigrated(userId);
        console.log(`Already migrated: ${alreadyMigrated}`);
        
        if (!alreadyMigrated) {
            console.log(`Starting migration for user: ${userId}`);
            await migrateUserData(userId);
            console.log(`Migration completed for user: ${userId}`);
            revalidatePath("/editor");
        }
        return { success: true };
    } catch (error) {
        console.error("Migration error:", error);
        return { success: false, error: "Failed to migrate user data" };
    }
}
