import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

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

        // Create a nodemailer transporter
        // Using Gmail SMTP - you'll need to configure environment variables
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Determine the feedback type label
        let typeLabel = "General Feedback";
        if (type === "bug") typeLabel = "Bug Report";
        else if (type === "feature") typeLabel = "Feature Suggestion";

        // Compose email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: "contact.chesspie@gmail.com",
            subject: `Chessperiment Feedback: ${typeLabel}`,
            html: `
                <h2>New Feedback Received</h2>
                <p><strong>Type:</strong> ${typeLabel}</p>
                <p><strong>From:</strong> ${email || "Anonymous"}</p>
                <hr>
                <h3>Message:</h3>
                <p>${message.replace(/\n/g, "<br>")}</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    This feedback was submitted via the chessperiment.app feedback form.
                </p>
            `,
            text: `
New Feedback Received

Type: ${typeLabel}
From: ${email || "Anonymous"}

Message:
${message}

---
This feedback was submitted via the chessperiment.app feedback form.
            `,
        };

        // Send email
        await transporter.sendMail(mailOptions);

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
