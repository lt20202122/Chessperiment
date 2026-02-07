import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = 'edge';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, email, message } = body;

        if (!message || !type) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Determine the feedback type label
        let typeLabel = "General Feedback";
        if (type === "bug") typeLabel = "Bug Report";
        else if (type === "feature") typeLabel = "Feature Suggestion";

        // Send email using Resend
        const { data, error } = await resend.emails.send({
            from: "Chessperiment Feedback <onboarding@resend.dev>",
            to: ["lasse.secaccbs@gmail.com"],
            subject: `Chessperiment Feedback: ${typeLabel}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <h2 style="color: #f59e0b;">New Feedback Received</h2>
                    <p><strong>Type:</strong> ${typeLabel}</p>
                    <p><strong>From:</strong> ${email || "Anonymous"}</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <h3 style="color: #333;">Message:</h3>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        ${message.replace(/\n/g, "<br>")}
                    </div>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        This feedback was submitted via the chessperiment.app feedback form.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend Error:", error);
            return NextResponse.json(
                { error: "Failed to send feedback" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, message: "Feedback sent successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error sending feedback:", error);
        return NextResponse.json(
            { error: "Failed to send feedback" },
            { status: 500 }
        );
    }
}
