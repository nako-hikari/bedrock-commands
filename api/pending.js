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
            "https://api.github.com/repos/nako-hikari/minecraft-bedrock/contents/bedrock-commands/pending",
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
                error: "Failed to read pending submissions",
                details: error
            });
        }

        const files = await response.json();

        const submissions = [];

        for (const file of files) {
            if (!file.name.endsWith(".json")) continue;

            const fileResponse = await fetch(file.download_url);

            if (!fileResponse.ok) continue;

            const submission = await fileResponse.json();

            submissions.push({
                ...submission,
                filename: file.name
            });
        }

        return res.status(200).json(submissions);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
          }
