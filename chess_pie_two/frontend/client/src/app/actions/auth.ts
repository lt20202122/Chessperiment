"use server";

import { auth } from "@/auth";
import { deleteUserAccount } from "@/lib/firestore";
import { revalidatePath } from "next/cache";

export async function deleteAccountAction() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await deleteUserAccount(session.user.id);
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting account:", error);
        return { success: false, error: error.message || "Failed to delete account" };
    }
}
