import crypto from "crypto";

export default async function handler(req, res) {
    const cookies = req.headers.cookie || "";

    const match = cookies.match(
        /(?:^|;\s*)admin_session=([^;]+)/
    );

    if (!match) {
        return res.status(401).json({
            authenticated: false
        });
    }

    const expected = crypto
        .createHmac("sha256", process.env.ADMIN_SESSION_SECRET)
        .update("nako-admin-session")
        .digest("hex");

    if (match[1] !== expected) {
        return res.status(401).json({
            authenticated: false
        });
    }

    return res.status(200).json({
        authenticated: true
    });
}
