import crypto from "crypto";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { key } = req.body || {};

        if (!key || key !== process.env.ADMIN_KEY) {
            return res.status(401).json({
                error: "Invalid admin key"
            });
        }

        const session = crypto
            .createHmac("sha256", process.env.ADMIN_SESSION_SECRET)
            .update("nako-admin-session")
            .digest("hex");

        res.setHeader(
            "Set-Cookie",
            `admin_session=${session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
        );

        return res.status(200).json({
            success: true
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
}
