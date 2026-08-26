export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }
    
    const adminKey = req.headers["x-admin-key"];

if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
        error: "Unauthorized"
    });
}

    try {
        const { filename } = req.body || {};

        if (!filename) {
            return res.status(400).json({
                error: "Filename is required"
            });
        }

        if (!filename.endsWith(".json")) {
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

        const pendingPath =
            `bedrock-commands/pending/${encodeURIComponent(filename)}`;

        const rejectedPath =
            `bedrock-commands/rejected/${filename}`;

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json"
        };

        /*
         * Get the pending file
         */

        const getResponse = await fetch(
            `https://api.github.com/repos/${repo}/contents/${pendingPath}`,
            {
                headers
            }
        );

        if (!getResponse.ok) {
            const error = await getResponse.text();

            return res.status(500).json({
                error: "Could not find pending submission",
                details: error
            });
        }

        const pendingFile =
            await getResponse.json();

        /*
         * Create the file in rejected/
         */

        const createResponse = await fetch(
            `https://api.github.com/repos/${repo}/contents/${rejectedPath}`,
            {
                method: "PUT",
                headers,
                body: JSON.stringify({
                    message:
                        `Reject command submission: ${filename}`,

                    content:
                        pendingFile.content.replace(/\n/g, ""),

                    branch: "main"
                })
            }
        );

        if (!createResponse.ok) {
            const error = await createResponse.text();

            return res.status(500).json({
                error: "Failed to move submission to rejected",
                details: error
            });
        }

        /*
         * Delete the original pending file
         */

        const deleteResponse = await fetch(
            `https://api.github.com/repos/${repo}/contents/${pendingPath}`,
            {
                method: "DELETE",
                headers,
                body: JSON.stringify({
                    message:
                        `Remove rejected submission: ${filename}`,

                    sha: pendingFile.sha,

                    branch: "main"
                })
            }
        );

        if (!deleteResponse.ok) {
            const error = await deleteResponse.text();

            return res.status(500).json({
                error:
                    "Rejected file was created, but pending file could not be removed",

                details: error
            });
        }

        return res.status(200).json({
            message: "Submission rejected",
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
