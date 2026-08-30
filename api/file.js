export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { filename } = req.query;

        if (!filename || !filename.endsWith(".txt")) {
            return res.status(400).json({
                error: "Invalid filename"
            });
        }

        if (
            filename.includes("/") ||
            filename.includes("\\") ||
            filename.includes("..")
        ) {
            return res.status(400).json({
                error: "Invalid filename"
            });
        }

        const token = process.env.GITHUB_TOKEN;

        if (!token) {
            return res.status(500).json({
                error: "GITHUB_TOKEN is not configured"
            });
        }

        const url =
            `https://api.github.com/repos/nako-hikari/minecraft-bedrock/contents/bedrock-commands/${encodeURIComponent(filename)}`;

        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });

        if (!response.ok) {
            return res.status(404).json({
                error: "Command file not found"
            });
        }

        const file = await response.json();

        if (file.type !== "file") {
            return res.status(400).json({
                error: "Not a file"
            });
        }

        const content =
            Buffer.from(file.content, "base64").toString("utf8");

        return res.status(200).json({
            filename: file.name,
            content
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
}
