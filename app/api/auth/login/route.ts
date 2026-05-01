import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        const adminUsername = process.env.ADMIN_USERNAME || "admin";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

        if (username !== adminUsername) {
            return NextResponse.json(
                { success: false, error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Check if password is hashed or plain
        let isValid = false;
        if (adminPassword.startsWith("$2")) {
            isValid = await bcrypt.compare(password, adminPassword);
        } else {
            isValid = password === adminPassword;
        }

        if (!isValid) {
            return NextResponse.json(
                { success: false, error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const token = await createToken({ username, role: "admin" });

        const response = NextResponse.json({ success: true, message: "Login successful" });
        response.cookies.set("admin-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Login failed" },
            { status: 500 }
        );
    }
}
