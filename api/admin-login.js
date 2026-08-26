export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const { key } = req.body || {};

    if (!key || key !== process.env.ADMIN_KEY) {
        return res.status(401).json({
            error: "Invalid admin key"
        });
    }

    return res.status(200).json({
        success: true
    });
}
