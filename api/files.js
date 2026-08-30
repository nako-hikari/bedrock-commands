export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const token = process.env.GITHUB_TOKEN;

        if (!token) {
            return res.status(500).json({
                error: "GITHUB_TOKEN is not configured"
            });
        }

        const response = await fetch(
            "https://api.github.com/repos/nako-hikari/minecraft-bedrock/contents/bedrock-commands",
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            }
        );

        if (!response.ok) {
            const error = await response.text();

            return res.status(500).json({
                error: "Failed to load command files",
                details: error
            });
        }

        const files = await response.json();

        const approvedFiles = files
            .filter(file =>
                file.type === "file" &&
                file.name.endsWith(".txt")
            )
            .map(file => ({
                name: file.name
            }));

        return res.status(200).json(approvedFiles);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
}
