export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { adminKey, filename, content } = req.body || {};

        if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }

        if (!filename || !filename.endsWith(".txt")) {
            return res.status(400).json({
                error: "Invalid filename"
            });
        }

        if (typeof content !== "string") {
            return res.status(400).json({
                error: "Content is required"
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

        const repo = "nako-hikari/minecraft-bedrock";

        const path =
            `bedrock-commands/${encodeURIComponent(filename)}`;

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json"
        };

        const getResponse = await fetch(
            `https://api.github.com/repos/${repo}/contents/${path}`,
            {
                headers
            }
        );

        if (!getResponse.ok) {
            return res.status(404).json({
                error: "Approved command file not found"
            });
        }

        const existingFile = await getResponse.json();

        const updateResponse = await fetch(
            `https://api.github.com/repos/${repo}/contents/${path}`,
            {
                method: "PUT",
                headers,
                body: JSON.stringify({
                    message: `Edit command creation: ${filename}`,
                    content: Buffer.from(content, "utf8").toString("base64"),
                    sha: existingFile.sha,
                    branch: "main"
                })
            }
        );

        if (!updateResponse.ok) {
            const error = await updateResponse.text();

            return res.status(500).json({
                error: "Failed to save changes",
                details: error
            });
        }

        return res.status(200).json({
            message: "Command updated successfully",
            filename
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
}
