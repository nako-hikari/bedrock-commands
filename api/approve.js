export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    // Check admin key
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

        const pendingUrl =
            `https://api.github.com/repos/nako-hikari/minecraft-bedrock/contents/bedrock-commands/pending/${encodeURIComponent(filename)}`;

        const getResponse = await fetch(pendingUrl, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });

        if (!getResponse.ok) {
            return res.status(500).json({
                error: "Could not find pending submission"
            });
        }

        const pendingFile =
            await getResponse.json();

        const submission =
            JSON.parse(
                Buffer.from(
                    pendingFile.content,
                    "base64"
                ).toString("utf8")
            );

        const approvedFilename =
            `${submission.id}.txt`;

        const approvedPath =
            `bedrock-commands/${approvedFilename}`;

        const createResponse =
            await fetch(
                `https://api.github.com/repos/nako-hikari/minecraft-bedrock/contents/${approvedPath}`,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/vnd.github+json",

                        "X-GitHub-Api-Version":
                            "2022-11-28",

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message:
                            `Approve command submission: ${submission.id}`,

                        content:
                            Buffer.from(
                                submission.content,
                                "utf8"
                            ).toString("base64")
                    })
                }
            );

        if (!createResponse.ok) {

            const error =
                await createResponse.text();

            return res.status(500).json({
                error:
                    "Failed to create approved command",

                details: error
            });
        }

        const deleteResponse =
            await fetch(
                pendingUrl,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/vnd.github+json",

                        "X-GitHub-Api-Version":
                            "2022-11-28",

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message:
                            `Remove approved submission: ${submission.id}`,

                        sha:
                            pendingFile.sha
                    })
                }
            );

        if (!deleteResponse.ok) {

            const error =
                await deleteResponse.text();

            return res.status(500).json({
                error:
                    "Command was created, but pending file could not be removed",

                details: error
            });
        }

        return res.status(200).json({
            message:
                "Submission approved",

            id:
                submission.id
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error:
                "Internal server error",

            details:
                error.message
        });
    }
}
