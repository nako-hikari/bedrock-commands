export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const {
            adminKey,
            filename
        } = req.body || {};

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

        const repo =
            "nako-hikari/minecraft-bedrock";

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json"
        };

        /*
         * Get approved file
         */

        const sourcePath =
            `bedrock-commands/${encodeURIComponent(filename)}`;

        const getResponse =
            await fetch(
                `https://api.github.com/repos/${repo}/contents/${sourcePath}`,
                {
                    headers
                }
            );

        if (!getResponse.ok) {

            return res.status(404).json({
                error: "Approved command file not found"
            });
        }

        const file =
            await getResponse.json();

        /*
         * Create outdated copy
         */

        const outdatedPath =
            `bedrock-commands/outdated/${encodeURIComponent(filename)}`;

        const createResponse =
            await fetch(
                `https://api.github.com/repos/${repo}/contents/${outdatedPath}`,
                {
                    method: "PUT",
                    headers,

                    body: JSON.stringify({
                        message:
                            `Mark command as outdated: ${filename}`,

                        content:
                            file.content.replace(/\n/g, ""),

                        branch: "main"
                    })
                }
            );

        if (!createResponse.ok) {

            const error =
                await createResponse.text();

            return res.status(500).json({
                error:
                    "Failed to move command to outdated",

                details: error
            });
        }

        /*
         * Delete approved version
         */

        const deleteResponse =
            await fetch(
                `https://api.github.com/repos/${repo}/contents/${sourcePath}`,
                {
                    method: "DELETE",
                    headers,

                    body: JSON.stringify({
                        message:
                            `Remove outdated command: ${filename}`,

                        sha: file.sha,

                        branch: "main"
                    })
                }
            );

        if (!deleteResponse.ok) {

            const error =
                await deleteResponse.text();

            return res.status(500).json({
                error:
                    "Outdated copy was created, but the original could not be removed",

                details: error
            });
        }

        return res.status(200).json({
            message:
                "Command marked as outdated",

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
