"use server";

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function submitReferralAction(answer: string) {
    console.log("=== submitReferralAction called ===");
    console.log("Answer:", answer);
    console.log("RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
    
    if (!answer) return { success: false, error: "No answer provided" };

    try {
        console.log("Attempting to send email via Resend...");
        const { data, error } = await resend.emails.send({
            from: 'Chessperiment Survey <delivered@resend.dev>',
            to: ['lassethoroe10@gmail.com'],
            subject: 'New Referral Survey Response',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <h2 style="color: #f59e0b;">New Referral Response</h2>
                    <p>A user just shared how they found <strong>Chessperiment</strong>:</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 1.1em; border-left: 4px solid #f59e0b;">
                        ${answer}
                    </div>
                    <p style="margin-top: 20px; font-size: 0.8em; color: #666;">
                        Sent from the Chessperiment Referral Survey Component.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend Error:", error);
            console.error("Full error object:", JSON.stringify(error, null, 2));
            return { success: false, error: error.message };
        }

        console.log("Email sent successfully!");
        console.log("Resend response data:", data);
        return { success: true, data };
    } catch (err) {
        console.error("Survey Action Error:", err);
        console.error("Full error:", JSON.stringify(err, null, 2));
        return { success: false, error: "Internal server error" };
    }
}
